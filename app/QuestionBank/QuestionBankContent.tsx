"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useState } from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import Question from "@/components/shared/Question" // or wherever your Question.tsx is located
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  List,
  Search,
  Flag,
  HelpCircle,
  Filter,
} from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

//
// --------------- Type Definitions ---------------
//

enum QuestionStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

type QuestionTypeString = "Multiple Choice" | "Numerical" | string

interface QuestionType {
  id: number
  questionId: string
  text: string

  subject?: string
  topic?: string
  subtopic?: string
  difficulty?: string
  type?: QuestionTypeString
  year?: number
  reviewed?: boolean   // flagged
  completed?: boolean  // marked complete

  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  lastAttempted?: string
  diagramUrl?: string
  status?: QuestionStatus

  // Additional fields
  exam?: string
  examGroup?: string
  country?: string
  key?: string
  date?: string
  description?: string
  isMemoryBased?: boolean
  isOnline?: boolean
  languages?: string[]
  title?: string
  pyqOutOfSyllabus?: number
  pyqTotal?: number
  pyqPrivate?: number
  pyqPublic?: number
  examId?: number
  subjectGroup?: string
  chapterGroup?: string
  chapter?: string
  topicName?: string
  examDate?: string
  content?: any
  permalink?: string
  paperId?: string
  isOutOfSyllabus?: boolean
  isBonus?: boolean
  marks?: number
  negMarks?: number
  correctAttempts?: string
  wrongAttempts?: string
  averageTimeTaken?: string
  customTag?: string
  explanation?: any
  paperTitle?: string
  timeAllotted?: number
  updatedTime?: number
  updatedBy?: string
  source?: string
  peerSolvedPercentage?: number
  linkedResources?: any
  commonMistakes?: any
  discussionLink?: string
  parentQuestionId?: number
  difficultyRating?: number
  yearKey?: string
  createdAt?: string
  updatedAt?: string
}

type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: string // "all" | "review" | "complete" | "incomplete"
}

type StateType = {
  questions: QuestionType[]
  filters: FiltersType
  searchQuery: string
  feedback: Record<string, string>
  selectedOptions: Record<string, string>
  notes: Record<string, string>
  showMarkscheme: Record<string, boolean>
  numericalAnswers: Record<string, string>
  dropdowns: {
    exam: boolean
    subject: boolean
    topic: boolean
    subtopic: boolean
    difficulty: boolean
    year: boolean
    type: boolean
  }
  loading: boolean
  currentPage: number
}

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_DROPDOWN"; payload: { tag: keyof FiltersType; value: boolean } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_PAGE"; payload: number }

const initialState: StateType = {
  questions: [],
  filters: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: [],
    years: [],
    status: "all", // or "complete" / "review" / "incomplete"
  },
  searchQuery: "",
  feedback: {},
  selectedOptions: {},
  notes: {},
  showMarkscheme: {},
  numericalAnswers: {},
  dropdowns: {
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  },
  loading: true,
  currentPage: 1,
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: action.payload }
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload }
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload }
    case "SET_NOTES":
      return { ...state, notes: action.payload }
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload }
    case "SET_NUMERICAL_ANSWERS":
      return { ...state, numericalAnswers: action.payload }
    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: { ...state.dropdowns, [action.payload.tag]: action.payload.value },
      }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    default:
      return state
  }
}

// Simple fuzzy:
function fuzzyContains(haystack: string, needle: string) {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const PAGE_SIZE = 10

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
        const pageNumber = currentPage + i - 2
        if (pageNumber > 0 && pageNumber <= totalPages) {
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          )
        }
        return null
      })}
      {totalPages > 5 && currentPage < totalPages - 2 && (
        <>
          <span className="text-gray-400">...</span>
          <Button variant="outline" size="icon" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

function GuestBanner() {
  return (
    <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
            <Info className="h-5 w-5 text-blue-700 dark:text-blue-200" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Guest Access</h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Try out the Question Bank features. Sign in to save your progress.
            </p>
          </div>
        </div>
        <Link href="/QuestionBank" className="hidden sm:block">
          <Button variant="outline" className="border-blue-200 dark:border-blue-700">
            Sign in
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

//
// We allow user to switch single vs. list, and handle mobile filter
//
enum ViewMode {
  SINGLE = "single",
  LIST = "list",
}

export default function QuestionBankContent() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { toast } = useToast()

  // If below 768px, default single mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.SINGLE)
      }
    }
  }, [])

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST)
  const [singleIndex, setSingleIndex] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false) // for mobile-friendly filter

  const fetchData = useCallback(async <T,>(url: string): Promise<T[]> => {
    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Failed fetch from ${url}: ${err}`)
    }
    const data = await res.json()
    if (Array.isArray(data)) return data as T[]
    if (data && Array.isArray(data.data)) return data.data as T[]
    return []
  }, [])

  const fetchAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // fetch questions
      const questionsData = await fetchData<QuestionType>("/api/questions")

      // If you also fetch userAnswers, userPerformance, etc., do merges here
      // For demonstration, we just store the questions
      const finalQuestions = questionsData.map((q, i) => {
        return { ...q, id: i + 1 }
      })

      dispatch({ type: "SET_QUESTIONS", payload: finalQuestions })
    } catch (err) {
      console.error("Error fetching questions:", err)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [fetchData, toast])

  useEffect(() => {
    // unconditional fetch, so it works even if not logged in
    fetchAllData()
  }, [fetchAllData])

  //
  // Fuzzy + filter
  //
  const filteredQuestions = useMemo(() => {
    const query = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      // fuzzy on text, subject, topic, etc.
      const fields = [q.text, q.subject, q.topic, q.subtopic, q.exam]
      const matchesSearch = fields.some((f) => f && fuzzyContains(f, query))

      // Check filters
      const { exams, subjects, topics, subtopics, difficulties, types, years, status } = state.filters

      if (exams.length && q.exam && !exams.includes(q.exam)) return false
      if (subjects.length && q.subject && !subjects.includes(q.subject)) return false
      if (topics.length && q.topic && !topics.includes(q.topic)) return false
      if (subtopics.length && q.subtopic && !subtopics.includes(q.subtopic)) return false
      if (difficulties.length && q.difficulty && !difficulties.includes(q.difficulty)) return false
      if (types.length && q.type && !types.includes(q.type)) return false
      if (years.length && q.year && !years.includes(q.year.toString())) return false

      if (status === "review" && !q.reviewed) return false
      if (status === "complete" && !q.completed) return false
      if (status === "incomplete" && q.completed) return false

      return matchesSearch
    })
  }, [state.questions, state.filters, state.searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
  const startIndex = (state.currentPage - 1) * PAGE_SIZE
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE)

  //
  // Single question next/prev
  //
  function handleSingleNext() {
    setSingleIndex((prev) => (prev < filteredQuestions.length - 1 ? prev + 1 : prev))
  }
  function handleSinglePrev() {
    setSingleIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  //
  // handleMarkComplete, handleMarkForReview, etc. -> calls API + updates state
  //
  const handleMarkComplete = useCallback(
    async (questionId: string, newVal?: boolean) => {
      const completedVal = newVal === undefined ? true : newVal
      try {
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            completed: completedVal,
          }),
        })
        // update local
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: completedVal } : q
          ),
        })
      } catch (err) {
        console.error(err)
      }
    },
    [state.questions]
  )

  const handleMarkForReview = useCallback(
    async (questionId: string, newVal?: boolean) => {
      const reviewVal = newVal === undefined ? true : newVal
      try {
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            reviewed: reviewVal,
          }),
        })
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, reviewed: reviewVal } : q
          ),
        })
      } catch (err) {
        console.error(err)
      }
    },
    [state.questions]
  )

  // e.g. for user answers
  const handleOptionClick = useCallback(() => {/* implement your logic */}, [])
  const handleNumericalSubmit = useCallback(() => {/* implement your logic */}, [])
  const handleNumericalChange = useCallback((qId: string, val: string) => {
    dispatch({
      type: "SET_NUMERICAL_ANSWERS",
      payload: { ...state.numericalAnswers, [qId]: val },
    })
  }, [state.numericalAnswers])

  // handle notes
  const handleNoteChange = useCallback(() => {/* implement your logic */}, [])

  // handle page change
  const handlePageChange = useCallback((page: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }, [])

  //
  // handle navigator click
  //
  function handleNavigatorClick(index: number) {
    const newPage = Math.floor(index / PAGE_SIZE) + 1
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
    setTimeout(() => {
      const questionElement = document.getElementById(
        `question-${filteredQuestions[index].questionId}`
      )
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  if (state.loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen p-4 sm:p-8 flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-4 text-3xl text-gray-800 dark:text-gray-100">Question Bank</h1>
          <Skeleton height={40} width={120} />
          <div className="mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mb-2">
                <Skeleton height={20} width={"80%"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  //
  // Single question mode
  //
  if (viewMode === ViewMode.SINGLE) {
    if (!filteredQuestions.length) {
      return (
        <div className="bg-white dark:bg-gray-900 min-h-screen p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => setViewMode(ViewMode.LIST)}>
                Switch to List View
              </Button>
            </div>
            <p className="mt-6 text-red-300">No questions found.</p>
          </div>
        </div>
      )
    }

    const currentQ = filteredQuestions[singleIndex]

    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen p-4 text-gray-900 dark:text-gray-100 flex justify-center">
        <div className="max-w-xl w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={() => setViewMode(ViewMode.LIST)}>
              List View
            </Button>
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Full-screen dialog for filters on mobile */}
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] dark:bg-gray-800 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <MobileFilterSection state={state} dispatch={dispatch} />
            </DialogContent>
          </Dialog>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.questionId}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 shadow p-3 sm:p-4 mb-6"
            >
              <Question
                question={currentQ}
                feedback={state.feedback[currentQ.questionId]}
                selectedOption={state.selectedOptions[currentQ.questionId]}
                numericalAnswer={state.numericalAnswers[currentQ.questionId]}
                showMarkscheme={state.showMarkscheme[currentQ.questionId]}
                handleOptionClick={handleOptionClick}
                handleNumericalSubmit={handleNumericalSubmit}
                handleNumericalChange={handleNumericalChange}
                handleMarkschemeToggle={(qId) => {
                  dispatch({
                    type: "SET_SHOW_MARKSCHEME",
                    payload: {
                      ...state.showMarkscheme,
                      [qId]: !state.showMarkscheme[qId],
                    },
                  })
                }}
                handleMarkForReview={handleMarkForReview}
                handleMarkComplete={handleMarkComplete}
                isMarkedForReview={currentQ.reviewed || false}
                isMarkedComplete={currentQ.completed || false}
                markschemesDisabled={false}
                note={state.notes[currentQ.questionId] || ""}
                handleNoteChange={handleNoteChange}
                handleDeleteNote={async () => {/* implement if needed */}}
                userId={"guest"}
                totalQuestions={filteredQuestions.length}
                currentQuestionIndex={singleIndex}
                handleQuestionChange={() => {/* do nothing here */}}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            <Button onClick={handleSinglePrev} disabled={singleIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <Button
              onClick={handleSingleNext}
              disabled={singleIndex === filteredQuestions.length - 1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  const questionStats = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    markedForReview: 0,
  }
  filteredQuestions.forEach((q) => {
    if (q.reviewed) questionStats.markedForReview++
    else if (q.completed) questionStats.answered++
    else if (q.lastAttempted) questionStats.notAnswered++
    else questionStats.notVisited++
  })

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 min-h-screen p-4 sm:p-8 flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => setViewMode(ViewMode.SINGLE)}>
              Single View
            </Button>
            <Button variant="outline" className="ml-2" onClick={() => setFiltersOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <MobileFilterSection state={state} dispatch={dispatch} />
            </DialogContent>
          </Dialog>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl font-semibold tracking-tight">
            Question Bank
          </h1>

          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
                }
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <List className="mr-2 h-4 w-4" />
                  Navigator
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800 dark:text-gray-100 max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Question Navigator</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((q, index) => (
                      <Tooltip key={q.questionId}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={q.completed ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleNavigatorClick(index)}
                            className={`w-10 h-10 dark:border-gray-700 ${
                              q.completed
                                ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                                : q.reviewed
                                ? "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : ""
                            }`}
                          >
                            {index + 1}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{q.text.substring(0, 60)}...</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-200 mb-4">
                Question Progress
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    {filteredQuestions.length > 0
                      ? Math.round(
                          (filteredQuestions.filter((qq) => qq.completed).length /
                            filteredQuestions.length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    filteredQuestions.length > 0
                      ? (filteredQuestions.filter((qq) => qq.completed).length /
                          filteredQuestions.length) *
                        100
                      : 0
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light text-blue-600 dark:text-blue-300">
                        {filteredQuestions.filter(
                          (qq) => !qq.completed && !qq.reviewed && !qq.lastAttempted
                        ).length}
                      </p>
                      <p className="text-sm font-light text-gray-500 dark:text-gray-300">
                        Not Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                    <div className="text-green-400 p-2 rounded-full bg-green-400/10">
                      <svg
                        className="h-5 w-5"
                        strokeWidth="2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-light text-green-600 dark:text-green-300">
                        {filteredQuestions.filter((qq) => qq.completed).length}
                      </p>
                      <p className="text-sm font-light text-gray-500 dark:text-gray-300">
                        Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light text-yellow-600 dark:text-yellow-300">
                        {filteredQuestions.filter((qq) => qq.reviewed).length}
                      </p>
                      <p className="text-sm font-light text-gray-500 dark:text-gray-300">
                        For Review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question, idx) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId]}
                  selectedOption={state.selectedOptions[question.questionId]}
                  numericalAnswer={state.numericalAnswers[question.questionId]}
                  showMarkscheme={state.showMarkscheme[question.questionId]}
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={handleNumericalChange}
                  handleMarkschemeToggle={(qId) => {
                    dispatch({
                      type: "SET_SHOW_MARKSCHEME",
                      payload: {
                        ...state.showMarkscheme,
                        [qId]: !state.showMarkscheme[qId],
                      },
                    })
                  }}
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedForReview={question.reviewed || false}
                  isMarkedComplete={question.completed || false}
                  markschemesDisabled={false}
                  note={state.notes[question.questionId] || ""}
                  handleNoteChange={handleNoteChange}
                  handleDeleteNote={async () => {}}
                  userId={"guest"}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={idx + (state.currentPage - 1) * PAGE_SIZE}
                  handleQuestionChange={handleNavigatorClick}
                />
              ))}
              <Pagination
                currentPage={state.currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <p className="text-red-400 dark:text-red-300">
              No questions found with these filters.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

//
// A separate component for the mobile-friendly filter selection
//
function MobileFilterSection({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  // We can list out each filter type in a collapsible, or just a big scrollable list
  const filterData = {
    exams: new Set<string>(),
    subjects: new Set<string>(),
    topics: new Set<string>(),
    subtopics: new Set<string>(),
    difficulties: new Set<string>(),
    years: new Set<string>(),
    types: new Set<string>(),
  }

  // gather possible values from state.questions
  state.questions.forEach((q) => {
    if (q.exam) filterData.exams.add(q.exam)
    if (q.subject) filterData.subjects.add(q.subject)
    if (q.topic) filterData.topics.add(q.topic)
    if (q.subtopic) filterData.subtopics.add(q.subtopic)
    if (q.difficulty) filterData.difficulties.add(q.difficulty)
    if (q.year) filterData.years.add(q.year.toString())
    if (q.type) filterData.types.add(q.type)
  })

  // We'll show them as checkboxes
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-4">
        {/* Status filter: all, review, complete, incomplete */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Question Status</h3>
          {["all", "review", "complete", "incomplete"].map((s) => (
            <div key={s} className="flex items-center mb-1">
              <input
                type="radio"
                name="status-filter"
                className="mr-2"
                checked={state.filters.status === s}
                onChange={() =>
                  dispatch({
                    type: "SET_FILTERS",
                    payload: { ...state.filters, status: s },
                  })
                }
              />
              <label className="text-sm">{s.charAt(0).toUpperCase() + s.slice(1)}</label>
            </div>
          ))}
        </div>

        {/* The rest: exams, subjects, etc. */}
        <FilterCheckboxGroup
          label="Exams"
          filterKey="exams"
          options={Array.from(filterData.exams)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Subjects"
          filterKey="subjects"
          options={Array.from(filterData.subjects)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Topics"
          filterKey="topics"
          options={Array.from(filterData.topics)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Subtopics"
          filterKey="subtopics"
          options={Array.from(filterData.subtopics)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Difficulties"
          filterKey="difficulties"
          options={Array.from(filterData.difficulties)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Years"
          filterKey="years"
          options={Array.from(filterData.years)}
          state={state}
          dispatch={dispatch}
        />
        <FilterCheckboxGroup
          label="Types"
          filterKey="types"
          options={Array.from(filterData.types)}
          state={state}
          dispatch={dispatch}
        />
      </div>
    </ScrollArea>
  )
}

//
// A smaller helper component for checkboxes
//
function FilterCheckboxGroup({
  label,
  filterKey,
  options,
  state,
  dispatch,
}: {
  label: string
  filterKey: keyof FiltersType
  options: string[]
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const filterValues = state.filters[filterKey] as string[]
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      {options.map((opt) => (
        <div key={opt} className="flex items-center mb-1">
          <input
            type="checkbox"
            className="mr-2"
            checked={filterValues.includes(opt)}
            onChange={() => {
              const isSelected = filterValues.includes(opt)
              let newArray = []
              if (isSelected) {
                newArray = filterValues.filter((v) => v !== opt)
              } else {
                newArray = [...filterValues, opt]
              }
              dispatch({
                type: "SET_FILTERS",
                payload: { ...state.filters, [filterKey]: newArray },
              })
            }}
          />
          <label className="text-sm">{opt}</label>
        </div>
      ))}
      {options.length === 0 && <p className="text-gray-400 text-sm">No options found.</p>}
    </div>
  )
}

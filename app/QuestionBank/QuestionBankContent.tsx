"use client"

import React, {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import Question from "@/components/shared/Question" 
import Popover from "@/components/shared/popover"
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

// -----------------------------------------------------------------------
// 1) Enums & Types
// -----------------------------------------------------------------------
enum QuestionStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

enum ViewMode {
  LIST = "list",
  SINGLE = "single",
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
  reviewed?: boolean
  completed?: boolean
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  lastAttempted?: string
  diagramUrl?: string
  status?: QuestionStatus

  // Additional if needed
  exam?: string
  examGroup?: string
  // ...
}

type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types"

type FiltersType = {
  [K in FilterKey]: string[]
} & {
  status: string // "all"|"complete"|"review"|"incomplete"
}

type DropdownsType = {
  [K in FilterKey]: boolean
}

// Distinct filter options from /api/filters
interface FilterOptionsType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
}

// For global DB stats
interface GlobalStats {
  total: number
  completed: number
  reviewed: number
  notAnswered: number
}

// Our main state
type StateType = {
  questions: QuestionType[]
  filters: FiltersType
  filterOptions: FilterOptionsType
  searchQuery: string
  dropdowns: DropdownsType
  feedback: Record<string, string | undefined>
  numericalAnswers: Record<string, string | undefined>
  showMarkscheme: Record<string, boolean>
  selectedOptions: Record<string, string | undefined>
  loading: boolean

  viewMode: ViewMode
  currentPage: number
  totalCount: number
  pageSize: number

  // NEW: global stats from entire DB
  globalStats: GlobalStats
}

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { tag: FilterKey; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string | undefined> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string | undefined> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string | undefined> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_TOTAL_COUNT"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_GLOBAL_STATS"; payload: GlobalStats }

function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// The initial state
const initialState: StateType = {
  questions: [],
  filters: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
    status: "all",
  },
  filterOptions: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
  },
  searchQuery: "",
  dropdowns: {
    exams: false,
    subjects: false,
    topics: false,
    subtopics: false,
    difficulties: false,
    years: false,
    types: false,
  },
  feedback: {},
  numericalAnswers: {},
  showMarkscheme: {},
  selectedOptions: {},
  loading: true,

  viewMode: ViewMode.LIST,
  currentPage: 1,
  totalCount: 0,
  pageSize: 10,

  // The global stats
  globalStats: {
    total: 0,
    completed: 0,
    reviewed: 0,
    notAnswered: 0,
  },
}

// The main reducer
function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: action.payload }
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload }
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [action.payload.tag]: action.payload.value,
        },
      }
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload }
    case "SET_NUMERICAL_ANSWERS":
      return { ...state, numericalAnswers: action.payload }
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload }
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload }
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload }
    case "SET_GLOBAL_STATS":
      return { ...state, globalStats: action.payload }
    default:
      return state
  }
}

// The main pagination UI
function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <span className="sr-only">Previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-4 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <span className="sr-only">Next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export default function QuestionBankContent() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const { toast } = useToast()

  const [viewMode, setViewMode] = React.useState<ViewMode>(ViewMode.LIST)
  const [singleIndex, setSingleIndex] = React.useState(0)
  const [filtersOpenMobile, setFiltersOpenMobile] = React.useState(false)

  // If small => single
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode(ViewMode.SINGLE)
    }
  }, [])

  // (1) Fetch distinct filter fields from /api/filters
  const fetchFilterOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch distinct filter fields.")
      const data = await res.json() as FilterOptionsType
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data })
    } catch (err) {
      console.error("Error fetching filter options:", err)
      toast({
        title: "Error",
        description: "Could not load filter fields. Try again later.",
        variant: "destructive",
      })
    }
  }, [toast])

  React.useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // (2) Fetch the global question stats => total, completed, reviewed, notAnswered from entire DB
  const fetchGlobalStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/questions/stats", { cache: "no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Failed to fetch stats: ${txt}`)
      }
      const data = await res.json() as GlobalStats
      dispatch({ type: "SET_GLOBAL_STATS", payload: data })
    } catch (err) {
      console.error("Error fetching global stats:", err)
      // fallback or keep zero
    }
  }, [])

  React.useEffect(() => {
    fetchGlobalStats()
  }, [fetchGlobalStats])

  // (3) Fetch questions with pagination + filters
  const fetchQuestions = React.useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const page = state.currentPage
      const pageSize = state.pageSize
      const { exams, subjects, topics, subtopics, difficulties, years, types } = state.filters

      // build query
      function arrToComma(arr: string[]): string {
        return arr.join(",")
      }
      const params = new URLSearchParams()
      if (exams.length) params.set("exam", arrToComma(exams))
      if (subjects.length) params.set("subject", arrToComma(subjects))
      if (topics.length) params.set("topic", arrToComma(topics))
      if (subtopics.length) params.set("subtopic", arrToComma(subtopics))
      if (difficulties.length) params.set("difficulty", arrToComma(difficulties))
      if (years.length) params.set("year", arrToComma(years))
      if (types.length) params.set("type", arrToComma(types))

      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      const url = `/api/questions?${params.toString()}`

      console.log("Fetching questions =>", url)
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Failed to fetch questions. ${txt}`)
      }
      const result = await res.json()

      let data: QuestionType[] = []
      let totalCount = 0
      if (Array.isArray(result)) {
        data = result
        totalCount = data.length
      } else if (result.data) {
        data = result.data
        totalCount = result.totalCount
      }

      dispatch({ type: "SET_QUESTIONS", payload: data })
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount })
    } catch (err) {
      console.error("Error fetching questions:", err)
      toast({
        title: "Error",
        description: "Failed to load questions. Try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.filters, state.currentPage, state.pageSize, toast])

  React.useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // handle page change
  function handlePageChange(page: number) {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }

  // Mark complete / Mark review
  const handleMarkComplete = React.useCallback(async (questionId: string, newVal?: boolean) => {
    const val = newVal===undefined ? true : newVal
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, completed: val }),
      })
      dispatch({
        type: "SET_QUESTIONS",
        payload: state.questions.map((q) =>
          q.questionId === questionId ? { ...q, completed: val } : q
        ),
      })
    } catch (err) {
      console.error("Error marking complete:", err)
    }
  }, [state.questions])

  const handleMarkForReview = React.useCallback(async (questionId: string, newVal?: boolean) => {
    const val = newVal===undefined ? true : newVal
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reviewed: val }),
      })
      dispatch({
        type: "SET_QUESTIONS",
        payload: state.questions.map((q) =>
          q.questionId === questionId ? { ...q, reviewed: val } : q
        ),
      })
    } catch (err) {
      console.error("Error marking review:", err)
    }
  }, [state.questions])

  // Option click for MCQ
  const handleOptionClick = React.useCallback((questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption
    dispatch({
      type:"SET_FEEDBACK",
      payload: {
        ...state.feedback,
        [questionId]: isCorrect?"correct":"incorrect",
      },
    })
    dispatch({
      type:"SET_SELECTED_OPTIONS",
      payload: {
        ...state.selectedOptions,
        [questionId]:option,
      },
    })
    // Mark question completed
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId===questionId ? { ...q, completed:true } : q
      ),
    })
  }, [state.feedback, state.selectedOptions, state.questions])

  // Numeric
  const handleNumericalSubmit = React.useCallback((questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer===correctAnswer
    dispatch({
      type:"SET_FEEDBACK",
      payload:{
        ...state.feedback,
        [questionId]: isCorrect?"correct":"incorrect",
      }
    })
    dispatch({
      type:"SET_NUMERICAL_ANSWERS",
      payload:{
        ...state.numericalAnswers,
        [questionId]:userAnswer
      }
    })
    // Mark question completed
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId===questionId ? { ...q, completed:true } : q
      ),
    })
  }, [state.feedback, state.numericalAnswers, state.questions])

  // Reset question
  const handleResetQuestion = React.useCallback(async (questionId: string) => {
    dispatch({
      type:"SET_FEEDBACK",
      payload:{ ...state.feedback, [questionId]: undefined },
    })
    dispatch({
      type:"SET_SELECTED_OPTIONS",
      payload:{ ...state.selectedOptions, [questionId]:undefined },
    })
    dispatch({
      type:"SET_NUMERICAL_ANSWERS",
      payload:{ ...state.numericalAnswers, [questionId]:undefined },
    })
    // uncomplete + unreview
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId===questionId ? { ...q, completed:false, reviewed:false } : q
      ),
    })
    try {
      await fetch("/api/questions", {
        method:"PATCH",
        headers: { "Content-Type":"application/json"},
        body: JSON.stringify({
          questionId,
          completed:false,
          reviewed:false,
        })
      })
    } catch(err) {
      console.error("Error resetting question:", err)
    }
  }, [state.feedback, state.selectedOptions, state.numericalAnswers, state.questions])

  // Local filter for status + search
  const filteredQuestions = React.useMemo(() => {
    const searchTerm = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      const textFields = [q.text, q.topic, q.subtopic, q.subject, q.exam]
      const matchesSearch = textFields.some((f) => f && fuzzyContains(f, searchTerm))

      let matchesStatus = true
      if (state.filters.status==="review" && !q.reviewed) {
        matchesStatus=false
      } else if (state.filters.status==="complete" && !q.completed) {
        matchesStatus=false
      } else if (state.filters.status==="incomplete" && q.completed) {
        matchesStatus=false
      }
      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.filters.status, state.searchQuery])

  // If loading
  if (state.loading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Question Bank</h1>
          <div className="flex space-x-4 mb-6">
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton height={40} width={120} />
              </div>
            ))}
          </div>
          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 p-4 border rounded-md dark:border-gray-700">
                <Skeleton height={20} width={"80%"} />
                <Skeleton height={20} width={"90%"} />
                <Skeleton height={20} width={"60%"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // If single
  if (viewMode===ViewMode.SINGLE) {
    if (!filteredQuestions.length) {
      return (
        <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">
            <Button variant="outline" onClick={() => setViewMode(ViewMode.LIST)}>
              Switch to List View
            </Button>
            <p className="mt-6 text-red-300">No questions found with these filters.</p>
          </div>
        </div>
      )
    }
    const currentQ = filteredQuestions[singleIndex]

    return (
      <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-4 text-gray-900 dark:text-gray-100 flex justify-center">
        <div className="max-w-xl w-full">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => setViewMode(ViewMode.LIST)}>
              List View
            </Button>

            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2 inline-flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] dark:bg-gray-800 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-4 p-2">
                    <FilterPanelMobile state={state} dispatch={dispatch} />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {singleIndex+1} / {filteredQuestions.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.questionId}
              initial={{ x:80, opacity:0 }}
              animate={{ x:0, opacity:1 }}
              exit={{ x:-80, opacity:0 }}
              transition={{ duration:0.3 }}
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
                handleNumericalChange={(qId, val) => {
                  dispatch({
                    type:"SET_NUMERICAL_ANSWERS",
                    payload:{ ...state.numericalAnswers, [qId]:val },
                  })
                }}
                handleMarkschemeToggle={(qId) =>
                  dispatch({
                    type:"SET_SHOW_MARKSCHEME",
                    payload:{
                      ...state.showMarkscheme,
                      [qId]:!state.showMarkscheme[qId],
                    },
                  })
                }
                handleMarkForReview={handleMarkForReview}
                handleMarkComplete={handleMarkComplete}
                handleResetQuestion={handleResetQuestion}
                isMarkedForReview={currentQ.reviewed||false}
                isMarkedComplete={currentQ.completed||false}
                markschemesDisabled={false}
                note={""}
                handleNoteChange={() => {}}
                handleDeleteNote={() => Promise.resolve()}
                userId={"guest"}
                totalQuestions={filteredQuestions.length}
                currentQuestionIndex={singleIndex}
                handleQuestionChange={() => {}}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            <Button
              onClick={() => setSingleIndex(Math.max(0, singleIndex-1))}
              disabled={singleIndex===0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <Button
              onClick={() => setSingleIndex(Math.min(filteredQuestions.length-1, singleIndex+1))}
              disabled={singleIndex===filteredQuestions.length-1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST view
  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => setViewMode(ViewMode.SINGLE)}>
              Switch to Single View
            </Button>
          </div>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl">
            Question Bank
          </h1>

          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) =>
                  dispatch({ type:"SET_SEARCH_QUERY", payload:e.target.value })
                }
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>

            {/* For mobile: single filters button */}
            <div className="block sm:hidden">
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 flex items-center"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[90vw] dark:bg-gray-800 dark:text-gray-100">
                  <DialogHeader>
                    <DialogTitle>Filters</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[70vh]">
                    <div className="space-y-4 p-2">
                      <FilterPanelMobile state={state} dispatch={dispatch} />
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Desktop question navigator */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 hidden sm:flex"
                >
                  <List className="mr-2 h-4 w-4" />
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Question Navigator</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((question, index) => (
                      <Button
                        key={question.questionId}
                        variant={question.completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          // scroll to the question
                          const el = document.getElementById(`question-${question.questionId}`)
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className={`w-10 h-10 dark:border-gray-700 ${
                          question.completed
                            ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                            : question.reviewed
                            ? "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : ""
                        }`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop filter row for status */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all","complete","review","incomplete"].map((filterStatus) => (
              <button
                key={filterStatus}
                onClick={() =>
                  dispatch({
                    type: "SET_FILTERS",
                    payload: { ...state.filters, status: filterStatus },
                  })
                }
                className={`px-4 py-2 rounded-md transition-colors
                  ${
                    state.filters.status === filterStatus
                      ? "bg-white dark:bg-gray-700 border dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 text-gray-500 dark:text-gray-100"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-gray-700 dark:hover:border-gray-500 text-gray-500 dark:text-gray-100"
                  }`}
              >
                {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              </button>
            ))}
          </div>

          {/* Desktop filter popovers */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(["exams","subjects","topics","subtopics","difficulties","years","types"] as FilterKey[]).map((filterType) => {
              // gather distinct values from state.filterOptions (all DB)
              const filterValues = state.filterOptions[filterType] || []

              return (
                <Popover
                  key={filterType}
                  content={
                    <div className="w-full bg-white dark:bg-gray-800 rounded-md p-2 sm:w-80">
                      <Input
                        type="text"
                        placeholder={`Search ${filterType}...`}
                        className="mb-2 dark:text-gray-100 dark:bg-gray-700 dark:placeholder-gray-400"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {filterValues.map((value) => (
                          <div key={value} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={state.filters[filterType].includes(value)}
                              onChange={() => {
                                const oldArr = state.filters[filterType]
                                const isSelected = oldArr.includes(value)
                                let newArr: string[]
                                if (isSelected) {
                                  newArr = oldArr.filter((v) => v !== value)
                                } else {
                                  newArr = [...oldArr, value]
                                }
                                dispatch({
                                  type: "SET_FILTERS",
                                  payload: { ...state.filters, [filterType]: newArr },
                                })
                              }}
                            />
                            <label className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-700">
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  align="start"
                  openPopover={state.dropdowns[filterType]}
                  setOpenPopover={(open) => {
                    dispatch({
                      type:"SET_DROPDOWN",
                      payload:{ tag: filterType, value:!!open }
                    })
                  }}
                >
                  <button
                    onClick={() => {
                      const isOpen = state.dropdowns[filterType]
                      dispatch({
                        type:"SET_DROPDOWN",
                        payload:{ tag: filterType, value:!isOpen }
                      })
                    }}
                    className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 transition-all duration-75 hover:border-gray-800 dark:hover:border-gray-500 focus:outline-none active:bg-gray-100 dark:active:bg-gray-700"
                  >
                    <p className="text-gray-600 dark:text-gray-300">
                      {state.filters[filterType].length
                        ? `${state.filters[filterType].length} selected`
                        : filterType.charAt(0).toUpperCase()+filterType.slice(1)
                      }
                    </p>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all" />
                  </button>
                </Popover>
              )
            })}
          </div>

          <Card className="bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-200 mb-6">
                Question Progress
              </h2>
              <div className="space-y-6">
                {/* 
                  Instead of referencing just state.questions, 
                  we show the globalStats from entire DB 
                */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    {state.globalStats.total>0
                      ? Math.round((state.globalStats.completed / state.globalStats.total)*100)
                      : 0
                    }%
                  </span>
                </div>
                <Progress
                  value={
                    state.globalStats.total>0
                      ? (state.globalStats.completed / state.globalStats.total)*100
                      : 0
                  }
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-700"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Not Answered */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                        {state.globalStats.notAnswered}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Not Answered
                      </p>
                    </div>
                  </div>

                  {/* Completed (Answered) */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
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
                      <p className="text-2xl font-light tracking-tighter text-green-600 dark:text-green-300">
                        {state.globalStats.completed}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Answered
                      </p>
                    </div>
                  </div>

                  {/* For Review */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-yellow-600 dark:text-yellow-300">
                        {state.globalStats.reviewed}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        For Review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {state.questions.length>0 ? (
            <>
              {filteredQuestions.map((question, index) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId]}
                  selectedOption={state.selectedOptions[question.questionId]}
                  numericalAnswer={state.numericalAnswers[question.questionId]}
                  showMarkscheme={state.showMarkscheme[question.questionId]||false}
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={(qId, val) => {
                    dispatch({
                      type:"SET_NUMERICAL_ANSWERS",
                      payload:{ ...state.numericalAnswers, [qId]:val },
                    })
                  }}
                  handleMarkschemeToggle={(qId) =>
                    dispatch({
                      type:"SET_SHOW_MARKSCHEME",
                      payload:{
                        ...state.showMarkscheme,
                        [qId]:!state.showMarkscheme[qId]
                      }
                    })
                  }
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  handleResetQuestion={async (qId) => {
                    // local
                    dispatch({
                      type:"SET_FEEDBACK",
                      payload:{ ...state.feedback, [qId]:undefined },
                    })
                    dispatch({
                      type:"SET_SELECTED_OPTIONS",
                      payload:{ ...state.selectedOptions, [qId]:undefined },
                    })
                    dispatch({
                      type:"SET_NUMERICAL_ANSWERS",
                      payload:{ ...state.numericalAnswers, [qId]:undefined },
                    })
                    dispatch({
                      type:"SET_QUESTIONS",
                      payload: state.questions.map((qu) =>
                        qu.questionId===qId ? { ...qu, completed:false, reviewed:false} : qu
                      ),
                    })
                    // server
                    try {
                      await fetch("/api/questions", {
                        method:"PATCH",
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({
                          questionId:qId,
                          completed:false,
                          reviewed:false,
                        })
                      })
                    } catch(err) {
                      console.error("Error resetting question:", err)
                    }
                  }}
                  isMarkedForReview={question.reviewed||false}
                  isMarkedComplete={question.completed||false}
                  markschemesDisabled={false}
                  note=""
                  handleNoteChange={()=>{}}
                  handleDeleteNote={()=>Promise.resolve()}
                  userId={"guest"}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={index}
                  handleQuestionChange={()=>{}}
                />
              ))}
              <Pagination
                currentPage={state.currentPage}
                totalCount={state.totalCount}
                pageSize={state.pageSize}
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

// Mobile filter panel
function FilterPanelMobile({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const statuses = ["all","complete","review","incomplete"]
  const filterTypes: FilterKey[] = [
    "exams",
    "subjects",
    "topics",
    "subtopics",
    "difficulties",
    "years",
    "types",
  ]

  function handleStatusChange(st: string) {
    dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, status:st } })
  }

  function handleArrayFilterChange(filterType: FilterKey, value: string) {
    const oldVals = state.filters[filterType]
    const isSelected = oldVals.includes(value)
    let newArr
    if (isSelected) {
      newArr = oldVals.filter((v) => v!==value)
    } else {
      newArr = [...oldVals,value]
    }
    dispatch({
      type:"SET_FILTERS",
      payload:{ ...state.filters, [filterType]:newArr },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold mb-2">Question Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <Button
              key={st}
              variant={state.filters.status===st ? "default":"outline"}
              onClick={() => handleStatusChange(st)}
            >
              {st.charAt(0).toUpperCase()+st.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filterTypes.map((filterType) => {
        const values = state.filterOptions[filterType] || []
        return (
          <div key={filterType}>
            <p className="font-semibold mb-2">
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto border p-2 rounded-md dark:border-gray-700">
              {values.map((val) => (
                <label key={val} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={state.filters[filterType].includes(val)}
                    onChange={() => handleArrayFilterChange(filterType,val)}
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

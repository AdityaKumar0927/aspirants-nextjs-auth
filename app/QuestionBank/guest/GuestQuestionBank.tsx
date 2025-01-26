"use client"

import React, {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  List,
  HelpCircle,
  Flag,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

// Import your shared <Question> component
import Question from "@/components/shared/Question"
import Popover from "@/components/shared/popover"

// We define how many questions per page we want from the server
const PAGE_SIZE = 10

// The shape of each question
interface QuestionType {
  id: number
  questionId?: string
  text?: string
  subject?: string
  topic?: string
  subtopic?: string
  difficulty?: string
  type?: string  // "Multiple Choice" | "Numerical" | ...
  year?: number
  options?: string[] // strictly an array of strings
  correctOption?: string
  exam?: string
  reviewed?: boolean
  completed?: boolean
}

// The shape of our filter sets
interface FiltersType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: string
}

interface StateType {
  questions: QuestionType[]       // The slice of questions we have for current page
  filters: FiltersType
  searchQuery: string
  dropdowns: Record<string, boolean>
  feedback: Record<string, string>
  selectedOptions: Record<string, string>
  notes: Record<string, string>
  currentPage: number
  loading: boolean

  // We store "reviewed" and "completed" flags in local state
  reviewed: Record<string, boolean>
  completed: Record<string, boolean>
  showMarkscheme: Record<string, boolean>

  // [PAGINATION] totalCount to figure out how many total pages
  totalCount: number
}

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { tag: string; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_REVIEWED"; payload: Record<string, boolean> }
  | { type: "SET_COMPLETED"; payload: Record<string, boolean> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_TOTAL_COUNT"; payload: number }

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
    status: "all",
  },
  searchQuery: "",
  dropdowns: {},
  feedback: {},
  selectedOptions: {},
  notes: {},
  currentPage: 1,
  loading: true,
  reviewed: {},
  completed: {},
  showMarkscheme: {},

  totalCount: 0,
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: action.payload }
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: { ...state.dropdowns, [action.payload.tag]: action.payload.value },
      }
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload }
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload }
    case "SET_NOTES":
      return { ...state, notes: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_REVIEWED":
      return { ...state, reviewed: action.payload }
    case "SET_COMPLETED":
      return { ...state, completed: action.payload }
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload }
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload }
    default:
      return state
  }
}

// A simple pagination component for controlling page
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
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export default function GuestQuestionBank() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const { toast } = useToast()

  // ------------------------------------------------------------------
  // 1. Fetch questions from server with pagination
  // ------------------------------------------------------------------
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // We'll request only the slice for the current page
      const page = state.currentPage
      const pageSize = PAGE_SIZE
      const url = `/api/questions?page=${page}&pageSize=${pageSize}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch questions")
      const result = await response.json()

      let data: QuestionType[] = []
      let totalCount = 0

      if (Array.isArray(result)) {
        // if no pagination returned
        data = result
        totalCount = data.length
      } else if (result.data) {
        // paginated result
        data = result.data
        totalCount = result.totalCount
      }

      // If needed, sort them by numeric portion of questionId or
      // you can rely on server sorting
      data.sort((a, b) => {
        const aMatch = a.questionId?.match(/\d+/)
        const bMatch = b.questionId?.match(/\d+/)
        const aNum = aMatch ? parseInt(aMatch[0], 10) : 0
        const bNum = bMatch ? parseInt(bMatch[0], 10) : 0
        return aNum - bNum
      })

      // Convert 'year' from string => number if needed
      const updatedQuestions = data.map((q, index) => ({
        ...q,
        id: index + 1,
      }))

      dispatch({ type: "SET_QUESTIONS", payload: updatedQuestions })
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount })
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.currentPage, toast])

  // re-fetch whenever currentPage changes
  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // 2. Load localStorage progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("guestProgress")
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      dispatch({ type: "SET_FEEDBACK", payload: progress.feedback || {} })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: progress.selectedOptions || {} })
      dispatch({ type: "SET_NOTES", payload: progress.notes || {} })
      dispatch({ type: "SET_REVIEWED", payload: progress.reviewed || {} })
      dispatch({ type: "SET_COMPLETED", payload: progress.completed || {} })
      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: progress.showMarkscheme || {} })
    }
  }, [])

  // 3. Save local progress whenever these state slices change
  useEffect(() => {
    localStorage.setItem(
      "guestProgress",
      JSON.stringify({
        feedback: state.feedback,
        selectedOptions: state.selectedOptions,
        notes: state.notes,
        reviewed: state.reviewed,
        completed: state.completed,
        showMarkscheme: state.showMarkscheme,
      })
    )
  }, [
    state.feedback,
    state.selectedOptions,
    state.notes,
    state.reviewed,
    state.completed,
    state.showMarkscheme,
  ])

  // 4. Provide local searching + filtering on the single fetched slice
  const filteredQuestions = useMemo(() => {
    const searchQuery = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      // Basic text search
      const matchesSearch =
        (q.text ?? "").toLowerCase().includes(searchQuery) ||
        (q.topic ?? "").toLowerCase().includes(searchQuery) ||
        (q.subtopic ?? "").toLowerCase().includes(searchQuery) ||
        (q.subject ?? "").toLowerCase().includes(searchQuery)

      // Basic filter by status
      if (state.filters.status === "complete") {
        // show only those with feedback = 'correct'
        const fb = state.feedback[q.questionId ?? ""]
        return matchesSearch && fb === "correct"
      } else if (state.filters.status === "review") {
        // show only those marked as reviewed
        return matchesSearch && !!state.reviewed[q.questionId ?? ""]
      }
      // else 'all'
      return matchesSearch
    })
  }, [state.questions, state.searchQuery, state.filters, state.feedback, state.reviewed])

  // 5. Provide local pagination for the filtered slice
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
  const startIndex = (state.currentPage - 1) * PAGE_SIZE
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE)

  // local page change
  const handlePageChange = useCallback((newPage: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
  }, [])

  // For toggling filters in your popovers
  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      // This code is an example if you had arrays in state.filters
      // But your code doesn't show that in detail. Adjust as needed.
      // For now, we do nothing since we do not store an actual array-based filter for "exams", etc. 
      console.log("handleFilterChange not fully implemented for guest, ignoring...", tag, value)
    },
    []
  )

  // 6. Basic feedback logic
  const handleOptionClick = useCallback(
    (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption
      const newFeedback = {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      }
      const newSelectedOptions = { ...state.selectedOptions, [questionId]: option }

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelectedOptions })
    },
    [state.feedback, state.selectedOptions]
  )

  const handleNumericalSubmit = useCallback(
    (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer
      dispatch({
        type: "SET_FEEDBACK",
        payload: {
          ...state.feedback,
          [questionId]: isCorrect ? "correct" : "incorrect",
        },
      })
    },
    [state.feedback]
  )

  const handleNumericalChange = useCallback((questionId: string, value: string) => {
    console.log(`Numerical answer for Q ${questionId} => ${value}`)
  }, [])

  // 7. Mark for review, Mark complete
  const handleMarkForReview = useCallback(
    (questionId: string) => {
      dispatch({
        type: "SET_REVIEWED",
        payload: { ...state.reviewed, [questionId]: true },
      })
    },
    [state.reviewed]
  )

  const handleMarkComplete = useCallback(
    (questionId: string) => {
      dispatch({
        type: "SET_COMPLETED",
        payload: { ...state.completed, [questionId]: true },
      })
    },
    [state.completed]
  )

  const handleMarkschemeToggle = useCallback(
    (questionId: string) => {
      dispatch({
        type: "SET_SHOW_MARKSCHEME",
        payload: {
          ...state.showMarkscheme,
          [questionId]: !state.showMarkscheme[questionId],
        },
      })
    },
    [state.showMarkscheme]
  )

  // 8. Reset question logic
  const handleResetQuestion = useCallback(
    (questionId: string) => {
      // Clear feedback & selected option
      const newFeedback = { ...state.feedback }
      delete newFeedback[questionId]

      const newSelected = { ...state.selectedOptions }
      delete newSelected[questionId]

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelected })

      // Unmark completed + reviewed
      const newReviewed = { ...state.reviewed, [questionId]: false }
      dispatch({ type: "SET_REVIEWED", payload: newReviewed })

      const newCompleted = { ...state.completed, [questionId]: false }
      dispatch({ type: "SET_COMPLETED", payload: newCompleted })
    },
    [state.feedback, state.selectedOptions, state.reviewed, state.completed]
  )

  const handleNavigatorClick = useCallback(
    (index: number) => {
      setIsNavigatorOpen(false)
      // If you want to auto-scroll, do so:
      setTimeout(() => {
        const questionElement = document.getElementById(
          `question-${paginatedQuestions[index].questionId}`
        )
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    },
    [paginatedQuestions]
  )

  // We'll compute stats for "answered", "not visited," etc. 
  const questionStats = useMemo(() => {
    // We can do a quick map over paginated or entire filtered set
    const subset = filteredQuestions // entire filtered set
    let notVisited = 0
    let answered = 0
    let markedForReview = 0
    let notAnswered = 0

    subset.forEach((q) => {
      const qid = q.questionId || ""
      if (state.reviewed[qid]) markedForReview++
      const fb = state.feedback[qid]
      if (fb === "correct") {
        answered++
      } else if (fb === "incorrect") {
        notAnswered++
      } else {
        notVisited++
      }
    })

    return {
      notVisited,
      answered,
      markedForReview,
      notAnswered,
    }
  }, [filteredQuestions, state.feedback, state.reviewed])

  if (state.loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left text-3xl">Guest Question Bank</h1>
          <Skeleton count={5} height={60} className="mb-4" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left text-3xl">Guest Question Bank</h1>
          <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <HelpCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-blue-900">Guest Access</h3>
                  <p className="text-sm text-blue-700">
                    Try out the Question Bank features. Sign in to save your progress.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEARCH + NAVIGATOR */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
                }
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <Dialog open={isNavigatorOpen} onOpenChange={setIsNavigatorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <List className="mr-2 h-4 w-4" />
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Question Navigator</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((question, index) => {
                      const qid = question.questionId ?? ""
                      const isCorrect = state.feedback[qid] === "correct"
                      return (
                        <Tooltip key={qid}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isCorrect ? "default" : "outline"}
                              size="sm"
                              className={`w-10 h-10 ${
                                isCorrect
                                  ? "bg-green-100 border-green-500 text-green-700"
                                  : ""
                              }`}
                              onClick={() => {
                                // We want to jump to the question
                                // But that question might not be on the current page
                                // We are only local-page. If you want to unify, adjust logic
                                handleNavigatorClick(index)
                              }}
                            >
                              {index + 1}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{(question.text ?? "").substring(0, 50)}...</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Progress Card */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light tracking-tight text-gray-200 mb-6">
                Question Progress
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light tracking-tight text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light tracking-tight text-gray-300">
                    {filteredQuestions.length > 0
                      ? Math.round(
                          (questionStats.answered / filteredQuestions.length) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    filteredQuestions.length > 0
                      ? (questionStats.answered / filteredQuestions.length) * 100
                      : 0
                  }
                  className="w-full h-1.5 bg-gray-700"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-300">
                        {questionStats.notVisited}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-400">
                        Not Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-green-400 p-2 rounded-full bg-green-400/10">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-green-300">
                        {questionStats.answered}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-400">
                        Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-yellow-300">
                        {questionStats.markedForReview}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-400">
                        For Review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display the local-page questions after filtering */}
          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question, index) => (
                <Question
                  key={question.questionId}
                  question={question}
                  // Provide local feedback
                  feedback={state.feedback[question.questionId ?? ""] ?? ""}
                  // Provide selected option for MCQ
                  selectedOption={state.selectedOptions[question.questionId ?? ""] ?? ""}
                  // If you store numeric answers, pass them here
                  numericalAnswer=""
                  // callbacks
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={handleNumericalChange}
                  handleOptionClick={handleOptionClick}

                  // Mark for review, complete
                  handleMarkForReview={() => handleMarkForReview(question.questionId ?? "")}
                  handleMarkComplete={() => handleMarkComplete(question.questionId ?? "")}

                  // Are they marked for review or complete?
                  isMarkedForReview={!!state.reviewed[question.questionId ?? ""]}
                  isMarkedComplete={!!state.completed[question.questionId ?? ""]}

                  // Markscheme
                  showMarkscheme={!!state.showMarkscheme[question.questionId ?? ""]}
                  handleMarkschemeToggle={() => handleMarkschemeToggle(question.questionId ?? "")}
                  markschemesDisabled={false}

                  // local note logic
                  note={state.notes[question.questionId ?? ""] || ""}
                  handleNoteChange={(qId, note) => {
                    const newNotes = { ...state.notes, [qId]: note }
                    dispatch({ type: "SET_NOTES", payload: newNotes })
                  }}
                  handleDeleteNote={async (qId) => {
                    const newNotes = { ...state.notes }
                    delete newNotes[qId]
                    dispatch({ type: "SET_NOTES", payload: newNotes })
                  }}

                  // you can store userId = 'guest'
                  userId="guest"

                  // For next/prev question or nav
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={index + (state.currentPage - 1)*PAGE_SIZE}
                  handleQuestionChange={handleNavigatorClick}

                  // The newly added reset logic
                  handleResetQuestion={handleResetQuestion}
                />
              ))}
              {/* local pagination for the filtered results */}
              <Pagination
                currentPage={state.currentPage}
                totalCount={filteredQuestions.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <p className="text-red-400">No questions found with the selected filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

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

const PAGE_SIZE = 10

//
// 1) Ensure 'options?: string[]' matches <Question> component's interface.
//
interface QuestionType {
  id: number
  questionId?: string
  text?: string
  subject?: string
  topic?: string
  subtopic?: string
  difficulty?: string
  type?: "Multiple Choice" | "Numerical" | string
  year?: number
  options?: string[]           // IMPORTANT: 'string[]' not '(string | undefined)[]'
  correctOption?: string
  exam?: string
  reviewed?: boolean
  completed?: boolean
}

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
  questions: QuestionType[]
  filters: FiltersType
  searchQuery: string
  dropdowns: Record<string, boolean>
  feedback: Record<string, string>
  selectedOptions: Record<string, string>
  notes: Record<string, string>
  currentPage: number
  loading: boolean
  reviewed: Record<string, boolean>
  completed: Record<string, boolean>
  showMarkscheme: Record<string, boolean>
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
    default:
      return state
  }
}

const Pagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
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
          <span className="text-gray-500">...</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
          >
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

export default function GuestQuestionBank() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const { toast } = useToast()

  //
  // 2) Fetch questions from your API:
  //    - parse year => number
  //    - convert 'options' from (string | undefined)[] to string[] by filtering out undefined
  //
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await fetch("/api/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const questionsData = await response.json()

      // Sort by numeric portion of questionId (if present)
      const sortedQuestions = questionsData.sort((a: any, b: any) => {
        const aMatch = a.questionId?.match(/\d+/)
        const bMatch = b.questionId?.match(/\d+/)
        const aNum = aMatch ? parseInt(aMatch[0], 10) : 0
        const bNum = bMatch ? parseInt(bMatch[0], 10) : 0
        return aNum - bNum
      })

      // Convert 'year' from string => number,
      // Filter out undefined from 'options' so final is string[] 
      const updatedQuestions: QuestionType[] = sortedQuestions.map(
        (q: any, index: number) => {
          return {
            ...q,
            id: index + 1, // numeric id
            year: q.year ? parseInt(q.year, 10) : undefined,
            options: q.options
              ? q.options.filter((opt: string | undefined): opt is string => !!opt)
              : undefined,
          }
        }
      )

      dispatch({ type: "SET_QUESTIONS", payload: updatedQuestions })
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
  }, [toast])

  // On mount, fetch Qs & load localStorage
  useEffect(() => {
    fetchQuestions()

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
  }, [fetchQuestions])

  // Save to localStorage on changes
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

  // Filtering
  const filteredQuestions = useMemo(() => {
    const searchQuery = state.searchQuery.toLowerCase()

    return state.questions.filter((question) => {
      const matchesSearch =
        (question.text ?? "").toLowerCase().includes(searchQuery) ||
        (question.topic ?? "").toLowerCase().includes(searchQuery) ||
        (question.subtopic ?? "").toLowerCase().includes(searchQuery) ||
        (question.subject ?? "").toLowerCase().includes(searchQuery)

      const matchesFilters =
        (!state.filters.exams.length ||
          (question.exam && state.filters.exams.includes(question.exam))) &&
        (!state.filters.subjects.length ||
          (question.subject && state.filters.subjects.includes(question.subject))) &&
        (!state.filters.topics.length ||
          (question.topic && state.filters.topics.includes(question.topic))) &&
        (!state.filters.subtopics.length ||
          (question.subtopic && state.filters.subtopics.includes(question.subtopic))) &&
        (!state.filters.difficulties.length ||
          (question.difficulty && state.filters.difficulties.includes(question.difficulty))) &&
        (!state.filters.years.length ||
          (question.year && state.filters.years.includes(String(question.year)))) &&
        (!state.filters.types.length ||
          (question.type && state.filters.types.includes(question.type)))

      if (state.filters.status === "complete") {
        // e.g., only show correct
        return matchesSearch && matchesFilters && state.feedback[question.questionId ?? ""] === "correct"
      } else if (state.filters.status === "review") {
        return matchesSearch && matchesFilters && state.reviewed[question.questionId ?? ""]
      }

      return matchesSearch && matchesFilters
    })
  }, [state.questions, state.filters, state.searchQuery, state.feedback, state.reviewed])

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
  const paginatedQuestions = useMemo(() => {
    const startIndex = (state.currentPage - 1) * PAGE_SIZE
    return filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredQuestions, state.currentPage])

  // Page handler
  const handlePageChange = useCallback((page: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }, [])

  // Filter toggles
  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      const filterValues = state.filters[tag]
      if (Array.isArray(filterValues)) {
        const isSelected = filterValues.includes(value)
        const updatedFilter = isSelected
          ? filterValues.filter((v) => v !== value)
          : [...filterValues, value]

        const newFilters = { ...state.filters, [tag]: updatedFilter }
        dispatch({ type: "SET_FILTERS", payload: newFilters })
      }
    },
    [state.filters]
  )

  // Option clicks (MCQ)
  const handleOptionClick = useCallback(
    (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption
      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" }
      const newSelectedOptions = { ...state.selectedOptions, [questionId]: option }

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelectedOptions })
    },
    [state.feedback, state.selectedOptions]
  )

  // Numerical
  const handleNumericalSubmit = useCallback(
    (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer
      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" }
      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
    },
    [state.feedback]
  )

  const handleNumericalChange = useCallback((questionId: string, value: string) => {
    // Optional: store numerical answers separately, or just console.log
    console.log(`Numerical answer for Q${questionId}: `, value)
  }, [])

  // Notes
  const handleNoteChange = useCallback(
    (questionId: string, note: string) => {
      const newNotes = { ...state.notes, [questionId]: note }
      dispatch({ type: "SET_NOTES", payload: newNotes })
    },
    [state.notes]
  )

  // Mark for review/complete
  const handleMarkForReview = useCallback(
    (questionId: string) => {
      const newReviewed = { ...state.reviewed, [questionId]: true }
      dispatch({ type: "SET_REVIEWED", payload: newReviewed })
    },
    [state.reviewed]
  )

  const handleMarkComplete = useCallback(
    (questionId: string) => {
      const newCompleted = { ...state.completed, [questionId]: true }
      dispatch({ type: "SET_COMPLETED", payload: newCompleted })
    },
    [state.completed]
  )

  // Markscheme
  const handleMarkschemeToggle = useCallback(
    (questionId: string) => {
      const newShowMarkscheme = {
        ...state.showMarkscheme,
        [questionId]: !state.showMarkscheme[questionId],
      }
      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: newShowMarkscheme })
    },
    [state.showMarkscheme]
  )

  // Navigator
  const handleNavigatorClick = useCallback(
    (index: number) => {
      const newPage = Math.floor(index / PAGE_SIZE) + 1
      dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
      setIsNavigatorOpen(false)

      // Optional scroll
      setTimeout(() => {
        const questionElement = document.getElementById(
          `question-${filteredQuestions[index].questionId}`
        )
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    },
    [filteredQuestions]
  )

  // Toggle popovers
  const handleSetDropdown = useCallback(
    (filterType: string) => {
      return (value: SetStateAction<boolean>) => {
        const newValue =
          typeof value === "function" ? value(state.dropdowns[filterType] || false) : value
        dispatch({
          type: "SET_DROPDOWN",
          payload: { tag: filterType, value: newValue },
        })
      }
    },
    [state.dropdowns]
  )

  // Stats
  const questionStats = useMemo(() => {
    const stats = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
    }

    filteredQuestions.forEach((question) => {
      const qid = question.questionId ?? ""
      if (state.reviewed[qid]) {
        stats.markedForReview++
      } else if (state.feedback[qid] === "correct") {
        stats.answered++
      } else if (state.selectedOptions[qid]) {
        stats.notAnswered++
      } else {
        stats.notVisited++
      }
    })

    return stats
  }, [filteredQuestions, state.feedback, state.selectedOptions, state.reviewed])

  if (state.loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
            Guest Question Bank
          </h1>
          <Skeleton count={5} height={100} className="mb-4" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
            Guest Question Bank
          </h1>

          <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <HelpCircle className="h-5 w-5 text-blue-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-blue-900">Guest Access</h3>
                  <p className="text-sm text-blue-700">
                    Try out the Question Bank features. Sign in to save your progress across devices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
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
                              onClick={() => handleNavigatorClick(index)}
                              className={`w-10 h-10 ${
                                isCorrect
                                  ? "bg-green-100 border-green-500 text-green-700"
                                  : ""
                              }`}
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

          <div className="flex space-x-4 mb-2">
            {["all", "complete", "review"].map((status) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      dispatch({
                        type: "SET_FILTERS",
                        payload: { ...state.filters, status },
                      })
                    }
                    className={`px-4 py-2 rounded-md ${
                      state.filters.status === status
                        ? "bg-white border hover:border-black border-gray-600 text-gray-500"
                        : "bg-white hover:border-black border border-gray-300 text-gray-500"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {["exams", "subjects", "topics", "subtopics", "difficulties", "years", "types"].map(
              (filterType) => (
                <Tooltip key={filterType}>
                  <TooltipTrigger asChild>
                    <Popover
                      content={
                        <div className="w-full bg-white rounded-md p-2 sm:w-80">
                          <Input
                            type="text"
                            placeholder={`Search ${filterType}...`}
                            className="mb-2"
                          />
                          <div className="max-h-60 overflow-y-auto">
                            {Array.from(
                              new Set(
                                state.questions
                                  .map((q) => {
                                    switch (filterType) {
                                      case "exams":
                                        return q.exam
                                      case "subjects":
                                        return q.subject
                                      case "topics":
                                        return q.topic
                                      case "subtopics":
                                        return q.subtopic
                                      case "difficulties":
                                        return q.difficulty
                                      case "years":
                                        return q.year?.toString()
                                      case "types":
                                        return q.type
                                      default:
                                        return ""
                                    }
                                  })
                                  .filter(Boolean)
                              )
                            ).map((value) => {
                              if (!value) return null
                              return (
                                <div key={value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`${filterType}-${value}`}
                                    className="mr-2"
                                    checked={
                                      (state.filters[filterType as keyof FiltersType] as string[])?.includes(
                                        value
                                      ) ?? false
                                    }
                                    onChange={() =>
                                      handleFilterChange(filterType as keyof FiltersType, value)
                                    }
                                  />
                                  <label
                                    htmlFor={`${filterType}-${value}`}
                                    className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                                  >
                                    {value}
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      }
                      align="start"
                      openPopover={state.dropdowns[filterType]}
                      setOpenPopover={handleSetDropdown(filterType)}
                    >
                      <button
                        onClick={() => handleSetDropdown(filterType)((prev) => !prev)}
                        className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 bg-white transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
                      >
                        <p className="text-gray-600">
                          {Array.isArray(state.filters[filterType as keyof FiltersType]) &&
                          (state.filters[filterType as keyof FiltersType] as string[]).length
                            ? `${
                                (state.filters[filterType as keyof FiltersType] as string[]).length
                              } selected`
                            : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </p>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-600 transition-all ${
                            state.dropdowns[filterType] ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent>
                    Select {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>

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
                      ? Math.round((questionStats.answered / filteredQuestions.length) * 100)
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

          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question, index) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId ?? ""]}
                  selectedOption={state.selectedOptions[question.questionId ?? ""]}
                  // If numerical logic is needed, pass real props or placeholders:
                  numericalAnswer=""
                  handleNumericalSubmit={(qid, userAnswer, correctAnswer) =>
                    handleNumericalSubmit(qid, userAnswer, correctAnswer)
                  }
                  handleNumericalChange={(qid, val) => handleNumericalChange(qid, val)}
                  handleOptionClick={handleOptionClick}
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedForReview={!!state.reviewed[question.questionId ?? ""]}
                  isMarkedComplete={!!state.completed[question.questionId ?? ""]}
                  showMarkscheme={!!state.showMarkscheme[question.questionId ?? ""]}
                  handleMarkschemeToggle={() => handleMarkschemeToggle(question.questionId ?? "")}
                  markschemesDisabled={false}
                  note={state.notes[question.questionId ?? ""] || ""}
                  handleNoteChange={handleNoteChange}
                  userId=""
                  handleDeleteNote={async (questionId: string) => {
                    const newNotes = { ...state.notes }
                    delete newNotes[questionId]
                    dispatch({ type: "SET_NOTES", payload: newNotes })
                  }}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={index + (state.currentPage - 1) * PAGE_SIZE}
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
            <p className="text-red-400">No questions found with the selected filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

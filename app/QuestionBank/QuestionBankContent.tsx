"use client"

import React, {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState
} from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import Question from "@/components/shared/Question" // Adjust import path if needed
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

// -------------- Type Declarations --------------

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

  // Additional fields from your original code if needed
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

// The filter keys
type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types"

// The shape of the filters
type FiltersType = {
  [K in FilterKey]: string[]
} & {
  status: string // "all" | "review" | "complete" | "incomplete" or custom
}

// The shape of "dropdowns"
type DropdownsType = {
  [K in FilterKey]: boolean
}

// Our state
type StateType = {
  questions: QuestionType[]
  filters: FiltersType
  searchQuery: string
  dropdowns: DropdownsType
  feedback: Record<string, string>
  numericalAnswers: Record<string, string>
  showMarkscheme: Record<string, boolean>
  selectedOptions: Record<string, string>
  notes: Record<string, string>
  loading: boolean
  currentPage: number
}

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { tag: FilterKey; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_PAGE"; payload: number }

function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// -------------- Reducer & initialState --------------

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
  notes: {},
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
    case "SET_NOTES":
      return { ...state, notes: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    default:
      return state
  }
}

const PAGE_SIZE = 10

// -------------- UI Components --------------

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
        <span className="sr-only">Previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
          <span className="text-gray-500 dark:text-gray-400">...</span>
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
        <span className="sr-only">Next page</span>
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
          <Button
            variant="outline"
            className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:hover:bg-blue-800"
          >
            Sign in
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

enum ViewMode {
  LIST = "list",
  SINGLE = "single",
}

// -------------- Main Component --------------

export default function QuestionBankContent() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST)
  const [singleIndex, setSingleIndex] = useState<number>(0)
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false)

  // If on mount we detect small screen, default to SINGLE
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode(ViewMode.SINGLE)
    }
  }, [])

  // typed fetch helper
  const fetchData = useCallback(async <T,>(url: string): Promise<T[]> => {
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch ${url}: ${errorText}`)
    }
    const data = await response.json()
    if (Array.isArray(data)) return data as T[]
    if (data && Array.isArray(data.data)) return data.data as T[]
    return []
  }, [])

  const fetchAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // fetch from /api/questions
      const questionsData = await fetchData<QuestionType>("/api/questions")

      const mergedQuestions: QuestionType[] = questionsData.map((q, index) => ({
        ...q,
        id: index + 1,
      }))

      dispatch({ type: "SET_QUESTIONS", payload: mergedQuestions })
    } catch (err) {
      console.error("Error fetching data:", err)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [fetchData, toast])

  useEffect(() => {
    // load data on mount
    fetchAllData()
  }, [fetchAllData])

  // Filter + search
  const filteredQuestions = useMemo(() => {
    const search = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      // naive fuzzy match on text, topic, subject, exam
      const textFields = [q.text, q.topic, q.subtopic, q.subject, q.exam, q.title]
      const matchesSearch = textFields.some(
        (field) => field && fuzzyContains(field, search)
      )

      // check filters
      let matchesFilters = true

      // for each array-based filter
      if (state.filters.exams.length && q.exam && !state.filters.exams.includes(q.exam)) {
        matchesFilters = false
      }
      if (state.filters.subjects.length && q.subject && !state.filters.subjects.includes(q.subject)) {
        matchesFilters = false
      }
      if (state.filters.topics.length && q.topic && !state.filters.topics.includes(q.topic)) {
        matchesFilters = false
      }
      if (
        state.filters.subtopics.length &&
        q.subtopic &&
        !state.filters.subtopics.includes(q.subtopic)
      ) {
        matchesFilters = false
      }
      if (
        state.filters.difficulties.length &&
        q.difficulty &&
        !state.filters.difficulties.includes(q.difficulty)
      ) {
        matchesFilters = false
      }
      if (state.filters.types.length && q.type && !state.filters.types.includes(q.type)) {
        matchesFilters = false
      }
      if (
        state.filters.years.length &&
        q.year &&
        !state.filters.years.includes(q.year.toString())
      ) {
        matchesFilters = false
      }

      // status filter
      if (state.filters.status === "review") {
        if (!q.reviewed) matchesFilters = false
      } else if (state.filters.status === "complete") {
        if (!q.completed) matchesFilters = false
      } else if (state.filters.status === "incomplete") {
        if (q.completed) matchesFilters = false
      }
      // else "all"

      return matchesSearch && matchesFilters
    })
  }, [state.filters, state.questions, state.searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
  const startIndex = (state.currentPage - 1) * PAGE_SIZE
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE)

  function handlePageChange(page: number) {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }

  // single question nav
  function handleSingleNext() {
    setSingleIndex((prev) => (prev < filteredQuestions.length - 1 ? prev + 1 : prev))
  }
  function handleSinglePrev() {
    setSingleIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  // toggling filters
  function toggleFilterDropdown(filterType: FilterKey) {
    const isOpen = state.dropdowns[filterType]
    dispatch({
      type: "SET_DROPDOWN",
      payload: { tag: filterType, value: !isOpen },
    })
  }

  const handleFilterChange = useCallback(
    (filterType: FilterKey, value: string) => {
      const oldValues = state.filters[filterType]
      if (Array.isArray(oldValues)) {
        const isSelected = oldValues.includes(value)
        let newArr: string[]
        if (isSelected) {
          newArr = oldValues.filter((v) => v !== value)
        } else {
          newArr = [...oldValues, value]
        }
        dispatch({
          type: "SET_FILTERS",
          payload: { ...state.filters, [filterType]: newArr },
        })
      }
    },
    [state.filters]
  )

  // handleMarkComplete, handleMarkForReview
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
        console.error("Error marking complete:", err)
      }
    },
    [state.questions]
  )

  const handleMarkForReview = useCallback(
    async (questionId: string, newVal?: boolean) => {
      const reviewedVal = newVal === undefined ? true : newVal
      try {
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            reviewed: reviewedVal,
          }),
        })
        // update local
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, reviewed: reviewedVal } : q
          ),
        })
      } catch (err) {
        console.error("Error marking review:", err)
      }
    },
    [state.questions]
  )

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

  // -------------- Render --------------
  if (state.loading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">
            Question Bank
          </h1>
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

  // SINGLE layout
  if (viewMode === ViewMode.SINGLE) {
    if (filteredQuestions.length === 0) {
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

            {/* Mobile-only filters button */}
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

            <span className="text-sm text-gray-500">
              {singleIndex + 1} / {filteredQuestions.length}
            </span>
          </div>

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
                handleOptionClick={() => {}}
                handleNumericalSubmit={() => {}}
                handleNumericalChange={() => {}}
                handleMarkschemeToggle={(qId) =>
                  dispatch({
                    type: "SET_SHOW_MARKSCHEME",
                    payload: {
                      ...state.showMarkscheme,
                      [qId]: !state.showMarkscheme[qId],
                    },
                  })
                }
                handleMarkForReview={handleMarkForReview}
                handleMarkComplete={handleMarkComplete}
                isMarkedForReview={currentQ.reviewed || false}
                isMarkedComplete={currentQ.completed || false}
                markschemesDisabled={false}
                note={state.notes[currentQ.questionId] || ""}
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

  // LIST layout
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
                  dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
                }
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>

            {/* On mobile, single “Filters” button */}
            <div className="block sm:hidden">
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 flex items-center">
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
                      <Tooltip key={question.questionId}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={question.completed ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleNavigatorClick(index)}
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
                        </TooltipTrigger>
                        <TooltipContent className="dark:bg-gray-700 dark:text-gray-50">
                          <p>{question.text.substring(0, 50)}...</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop filter row (status) */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all", "complete", "review", "incomplete"].map((filterStatus) => (
              <Tooltip key={filterStatus}>
                <TooltipTrigger asChild>
                  <button
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
                </TooltipTrigger>
                <TooltipContent className="dark:bg-gray-700 dark:text-gray-50">
                  {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Desktop filter popovers (exams, subjects, etc.) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {["exams", "subjects", "topics", "subtopics", "difficulties", "years", "types"].map(
              (filterType) => (
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
                              .filter(Boolean) as string[]
                          )
                        ).map((value) => (
                          <div key={value} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={(
                                state.filters[filterType as FilterKey] as string[]
                              ).includes(value)}
                              onChange={() => handleFilterChange(filterType as FilterKey, value)}
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
                  openPopover={state.dropdowns[filterType as FilterKey]}
                  setOpenPopover={(open) => {
                    dispatch({
                      type: "SET_DROPDOWN",
                      payload: { tag: filterType as FilterKey, value: !!open },
                    })
                  }}
                >
                  <button
                    onClick={() => toggleFilterDropdown(filterType as FilterKey)}
                    className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 transition-all duration-75 hover:border-gray-800 dark:hover:border-gray-500 focus:outline-none active:bg-gray-100 dark:active:bg-gray-700"
                  >
                    <p className="text-gray-600 dark:text-gray-300">
                      {Array.isArray(state.filters[filterType as FilterKey]) &&
                      (state.filters[filterType as FilterKey] as string[]).length
                        ? `${
                            (state.filters[filterType as FilterKey] as string[]).length
                          } selected`
                        : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </p>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all" />
                  </button>
                </Popover>
              )
            )}
          </div>

          {/* progress card */}
          <Card className="bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-200 mb-6">
                Question Progress
              </h2>
              <div className="space-y-6">
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
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-700"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                        {
                          filteredQuestions.filter(
                            (qq) => !qq.reviewed && !qq.completed && !qq.lastAttempted
                          ).length
                        }
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Not Answered
                      </p>
                    </div>
                  </div>
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
                        {filteredQuestions.filter((qq) => qq.completed).length}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-yellow-600 dark:text-yellow-300">
                        {filteredQuestions.filter((qq) => qq.reviewed).length}
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

          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question, index) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId]}
                  selectedOption={state.selectedOptions[question.questionId]}
                  numericalAnswer={state.numericalAnswers[question.questionId]}
                  showMarkscheme={state.showMarkscheme[question.questionId]}
                  handleOptionClick={() => {}}
                  handleNumericalSubmit={() => {}}
                  handleNumericalChange={(qId, val) => {
                    dispatch({
                      type: "SET_NUMERICAL_ANSWERS",
                      payload: { ...state.numericalAnswers, [qId]: val },
                    })
                  }}
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
                  handleNoteChange={() => {}}
                  handleDeleteNote={() => Promise.resolve()}
                  userId={"guest"}
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
            <p className="text-red-400 dark:text-red-300">
              No questions found with these filters.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * FilterPanelMobile - a dedicated panel for mobile that allows the user
 * to select status, plus each exam/subject/etc. in a single place.
 */
function FilterPanelMobile({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  // For statuses
  const statuses = ["all", "complete", "review", "incomplete"]
  // For each filter type
  const filterTypes: FilterKey[] = [
    "exams",
    "subjects",
    "topics",
    "subtopics",
    "difficulties",
    "years",
    "types",
  ]

  const handleStatusChange = (st: string) => {
    dispatch({ type: "SET_FILTERS", payload: { ...state.filters, status: st } })
  }
  const handleArrayFilterChange = (filterType: FilterKey, value: string) => {
    const oldValues = state.filters[filterType]
    const isSelected = oldValues.includes(value)
    let newArr: string[]
    if (isSelected) {
      newArr = oldValues.filter((v) => v !== value)
    } else {
      newArr = [...oldValues, value]
    }
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [filterType]: newArr },
    })
  }

  return (
    <div className="space-y-4">
      {/* Status radio or button group */}
      <div>
        <p className="font-semibold mb-2">Question Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <Button
              key={st}
              variant={state.filters.status === st ? "default" : "outline"}
              onClick={() => handleStatusChange(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Each filter type */}
      {filterTypes.map((filterType) => {
        const values = Array.from(
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
              .filter(Boolean) as string[]
          )
        )
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
                    checked={(
                      state.filters[filterType] as string[]
                    ).includes(val)}
                    onChange={() => handleArrayFilterChange(filterType, val)}
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

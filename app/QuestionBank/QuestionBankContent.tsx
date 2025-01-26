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

  // Additional
  exam?: string
  // ... (rest as needed)
}

type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types"

// The shape of "filters"
type FiltersType = {
  [K in FilterKey]: string[]
} & {
  status: string
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

type StateType = {
  questions: QuestionType[]
  filters: FiltersType
  filterOptions: FilterOptionsType  // The distinct lists from /api/filters
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

function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// -----------------------------------------------------------------------
// 2) The initial state
// -----------------------------------------------------------------------
const PAGE_SIZE_DEFAULT = 10

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
  pageSize: PAGE_SIZE_DEFAULT,
}

// -----------------------------------------------------------------------
// 3) Reducer
// -----------------------------------------------------------------------
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
    default:
      return state
  }
}

// -----------------------------------------------------------------------
// 4) Pagination UI
// -----------------------------------------------------------------------
function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (p: number) => void
}) {
  const totalPages = Math.ceil(totalCount / pageSize)
  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
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
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

// -----------------------------------------------------------------------
// 5) The main component
// -----------------------------------------------------------------------
export default function QuestionBankContent() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { toast } = useToast()

  const [singleIndex, setSingleIndex] = useState(0)
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false)

  // If small screen => single
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.SINGLE })
    }
  }, [])

  // ----------------------------------------------------------------------
  // (A) Fetch the distinct filter fields from /api/filters
  // ----------------------------------------------------------------------
  const fetchFilterOptions = useCallback(async () => {
    try {
      console.log("Fetching distinct filter options from /api/filters.")
      const res = await fetch("/api/filters", { cache: "no-store" })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }
      const data = await res.json() as FilterOptionsType
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data })
    } catch (err) {
      console.error("Error fetching filter options:", err)
      toast({
        title: "Error",
        description: "Could not load distinct filter fields. Try again later.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // ----------------------------------------------------------------------
  // (B) Fetch questions from /api/questions with ascending order
  //     and your filters (exams, subject, etc.) plus page & pageSize
  // ----------------------------------------------------------------------
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      // build query
      const page = state.currentPage
      const pageSize = state.pageSize
      const { exams, subjects, topics, subtopics, difficulties, years, types, status } = state.filters

      const params = new URLSearchParams()
      // If your server only supports single-value for each filter, pick the first
      // If it supports multiple, pass them however your server expects
      if (exams.length) params.set("exam", exams[0])
      if (subjects.length) params.set("subject", subjects[0])
      if (topics.length) params.set("topic", topics[0])
      if (subtopics.length) params.set("subtopic", subtopics[0])
      if (difficulties.length) params.set("difficulty", difficulties[0])
      if (years.length) params.set("year", years[0])
      if (types.length) params.set("type", types[0])
      // if you want to handle "status" server side, you can pass it
      // but here we keep it local, so we won't pass it
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      const url = `/api/questions?${params.toString()}`
      console.log("Fetching questions =>", url)

      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Failed to fetch. ${txt}`)
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
      // store them
      dispatch({ type: "SET_QUESTIONS", payload: data })
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount })
    } catch (err) {
      console.error("Error fetching questions:", err)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.currentPage, state.pageSize, state.filters, toast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // handle page change
  const handlePageChange = useCallback((newPage: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
  }, [])

  // Mark complete, mark review
  const handleMarkComplete = useCallback(async (questionId: string, newVal?: boolean) => {
    const completedVal = newVal === undefined ? true : newVal
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, completed: completedVal }),
      })
      dispatch({
        type: "SET_QUESTIONS",
        payload: state.questions.map((q) =>
          q.questionId === questionId ? { ...q, completed: completedVal } : q
        ),
      })
    } catch (err) {
      console.error("Error marking complete:", err)
    }
  }, [state.questions])

  const handleMarkForReview = useCallback(async (questionId: string, newVal?: boolean) => {
    const reviewedVal = newVal === undefined ? true : newVal
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reviewed: reviewedVal }),
      })
      dispatch({
        type: "SET_QUESTIONS",
        payload: state.questions.map((q) =>
          q.questionId === questionId ? { ...q, reviewed: reviewedVal } : q
        ),
      })
    } catch (err) {
      console.error("Error marking review:", err)
    }
  }, [state.questions])

  // Option click for MCQ
  const handleOptionClick = useCallback((questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption
    dispatch({
      type: "SET_FEEDBACK",
      payload: {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      },
    })
    dispatch({
      type: "SET_SELECTED_OPTIONS",
      payload: {
        ...state.selectedOptions,
        [questionId]: option,
      },
    })
    // Mark question complete
    dispatch({
      type: "SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId === questionId ? { ...q, completed: true } : q
      ),
    })
  }, [state.feedback, state.selectedOptions, state.questions])

  // numeric
  const handleNumericalSubmit = useCallback((questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer
    dispatch({
      type: "SET_FEEDBACK",
      payload: {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      },
    })
    dispatch({
      type: "SET_NUMERICAL_ANSWERS",
      payload: {
        ...state.numericalAnswers,
        [questionId]: userAnswer,
      },
    })
    // Mark question complete
    dispatch({
      type: "SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId === questionId ? { ...q, completed: true } : q
      ),
    })
  }, [state.feedback, state.numericalAnswers, state.questions])

  // reset
  const handleResetQuestion = useCallback(async (questionId: string) => {
    dispatch({
      type: "SET_FEEDBACK",
      payload: { ...state.feedback, [questionId]: undefined },
    })
    dispatch({
      type: "SET_SELECTED_OPTIONS",
      payload: { ...state.selectedOptions, [questionId]: undefined },
    })
    dispatch({
      type: "SET_NUMERICAL_ANSWERS",
      payload: { ...state.numericalAnswers, [questionId]: undefined },
    })
    // uncomplete + unreview
    dispatch({
      type: "SET_QUESTIONS",
      payload: state.questions.map((q) =>
        q.questionId === questionId ? { ...q, completed: false, reviewed: false } : q
      ),
    })

    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          completed: false,
          reviewed: false,
        }),
      })
    } catch (err) {
      console.error("Error resetting question:", err)
    }
  }, [state.feedback, state.selectedOptions, state.numericalAnswers, state.questions])

  // local filter for status & search
  const filteredQuestions = useMemo(() => {
    const searchTerm = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      const textFields = [q.text, q.subject, q.topic, q.subtopic, q.exam]
      const matchesSearch = textFields.some((f) => f && fuzzyContains(f, searchTerm))

      let matchesStatus = true
      if (state.filters.status === "review" && !q.reviewed) {
        matchesStatus = false
      } else if (state.filters.status === "complete" && !q.completed) {
        matchesStatus = false
      } else if (state.filters.status === "incomplete" && q.completed) {
        matchesStatus = false
      }
      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.filters.status, state.searchQuery])

  // If loading
  if (state.loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-4 text-3xl">Question Bank</h1>
          <Skeleton count={8} />
        </div>
      </div>
    )
  }

  // Single vs list
  if (state.viewMode === ViewMode.SINGLE) {
    if (filteredQuestions.length === 0) {
      return (
        <div className="bg-white w-full min-h-screen p-4 sm:p-8">
          <Button variant="outline" onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}>
            Switch to List View
          </Button>
          <p className="mt-4 text-red-300">No questions found with these filters.</p>
        </div>
      )
    }
    const currentQ = filteredQuestions[singleIndex]
    return (
      <div className="bg-white w-full min-h-screen p-4 sm:p-8 flex justify-center">
        <div className="max-w-xl w-full">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}>
              List View
            </Button>
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2 inline-flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
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

            <span className="text-sm">
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
              className="rounded-md border bg-white shadow p-3 sm:p-4 mb-6"
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
                    type: "SET_NUMERICAL_ANSWERS",
                    payload: { ...state.numericalAnswers, [qId]: val },
                  })
                }}
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
                handleResetQuestion={handleResetQuestion}
                isMarkedForReview={currentQ.reviewed || false}
                isMarkedComplete={currentQ.completed || false}
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
              disabled={singleIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <Button
              onClick={() => setSingleIndex(Math.min(filteredQuestions.length-1, singleIndex+1))}
              disabled={singleIndex === filteredQuestions.length-1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST
  return (
    <TooltipProvider>
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.SINGLE })}>
              Switch to Single View
            </Button>
          </div>

          <h1 className="mb-2 text-3xl sm:text-4xl">Question Bank</h1>

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

            {/* Mobile single filter button */}
            <div className="block sm:hidden">
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                <Button variant="outline" className="hidden sm:flex">
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
                    {filteredQuestions.map((q, idx) => (
                      <Button
                        key={q.questionId}
                        variant={q.completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById(`question-${q.questionId}`)
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className={`w-10 h-10 ${
                          q.completed
                            ? "bg-green-100 border-green-500 text-green-700"
                            : q.reviewed
                            ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                            : ""
                        }`}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop filter row for status */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all","complete","review","incomplete"].map((st) => (
              <Button
                key={st}
                variant={state.filters.status === st ? "default" : "outline"}
                onClick={() => {
                  dispatch({ type: "SET_FILTERS", payload: { ...state.filters, status: st } })
                }}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Button>
            ))}
          </div>

          {/* Desktop filter popovers for exam, subject, etc. from state.filterOptions */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(["exams","subjects","topics","subtopics","difficulties","years","types"] as FilterKey[]).map((filterKey) => {
              const distinctValues = state.filterOptions[filterKey] || []

              return (
                <Popover
                  key={filterKey}
                  content={
                    <div className="w-full bg-white rounded-md p-2 sm:w-80">
                      <Input
                        type="text"
                        placeholder={`Search ${filterKey}...`}
                        className="mb-2"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {distinctValues.map((val) => (
                          <div key={val} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={state.filters[filterKey].includes(val)}
                              onChange={() => {
                                const oldArray = state.filters[filterKey]
                                const isChecked = oldArray.includes(val)
                                let newArray: string[]
                                if (isChecked) {
                                  newArray = oldArray.filter((x) => x!==val)
                                } else {
                                  newArray = [...oldArray, val]
                                }
                                dispatch({
                                  type: "SET_FILTERS",
                                  payload: { ...state.filters, [filterKey]: newArray },
                                })
                              }}
                            />
                            <label className="p-2 text-sm">
                              {val}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  align="start"
                  openPopover={state.dropdowns[filterKey]}
                  setOpenPopover={(open) => {
                    dispatch({
                      type: "SET_DROPDOWN",
                      payload: { tag: filterKey, value: !!open },
                    })
                  }}
                >
                  <Button
                    variant="outline"
                    className="flex items-center justify-between w-36"
                    onClick={() => {
                      const isOpen = state.dropdowns[filterKey]
                      dispatch({
                        type: "SET_DROPDOWN",
                        payload: { tag: filterKey, value: !isOpen },
                      })
                    }}
                  >
                    {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </Popover>
              )
            })}
          </div>

          {/* Progress card */}
          <Card className="bg-gradient-to-br from-gray-200 to-gray-100 text-gray-900 border-gray-200 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light mb-6">Question Progress</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light text-gray-500">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light text-gray-500">
                    {state.questions.length>0
                      ? Math.round(
                          (state.questions.filter((qq) => qq.completed).length / state.questions.length)*100
                        )
                      : 0
                    }%
                  </span>
                </div>
                <Progress
                  value={
                    state.questions.length>0
                      ? (state.questions.filter((qq) => qq.completed).length / state.questions.length)*100
                      : 0
                  }
                  className="w-full h-1.5 bg-gray-300"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 border border-gray-200">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600">
                        {state.questions.filter((qq) => !qq.reviewed && !qq.completed && !qq.lastAttempted).length}
                      </p>
                      <p className="text-sm font-light text-gray-500">
                        Not Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 border border-gray-200">
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
                      <p className="text-2xl font-light tracking-tighter text-green-600">
                        {state.questions.filter((qq) => qq.completed).length}
                      </p>
                      <p className="text-sm font-light text-gray-500">
                        Answered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 border border-gray-200">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-yellow-600">
                        {state.questions.filter((qq) => qq.reviewed).length}
                      </p>
                      <p className="text-sm font-light text-gray-500">
                        For Review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {state.questions.length > 0 ? (
            <>
              {filteredQuestions.map((question, idx) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId]}
                  selectedOption={state.selectedOptions[question.questionId]}
                  numericalAnswer={state.numericalAnswers[question.questionId]}
                  showMarkscheme={state.showMarkscheme[question.questionId]}
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={(qId, val) => {
                    dispatch({
                      type: "SET_NUMERICAL_ANSWERS",
                      payload: {
                        ...state.numericalAnswers,
                        [qId]: val,
                      },
                    })
                  }}
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
                  handleResetQuestion={handleResetQuestion}
                  isMarkedForReview={question.reviewed || false}
                  isMarkedComplete={question.completed || false}
                  markschemesDisabled={false}
                  note=""
                  handleNoteChange={() => {}}
                  handleDeleteNote={() => Promise.resolve()}
                  userId="guest"
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={idx}
                  handleQuestionChange={() => {}}
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
            <p className="text-red-400">No questions found with these filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// -----------------------------------------------------------------------
// 6) FilterPanelMobile
// -----------------------------------------------------------------------
function FilterPanelMobile({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const statuses = ["all", "complete", "review", "incomplete"]
  const filterTypes: FilterKey[] = ["exams","subjects","topics","subtopics","difficulties","years","types"]

  function handleStatusChange(st: string) {
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, status: st },
    })
  }

  function handleArrayFilterChange(filterType: FilterKey, val: string) {
    const oldArr = state.filters[filterType]
    const isIn = oldArr.includes(val)
    let newArr: string[]
    if (isIn) {
      newArr = oldArr.filter((x) => x !== val)
    } else {
      newArr = [...oldArr, val]
    }
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [filterType]: newArr },
    })
  }

  return (
    <div className="space-y-4">
      {/* Status */}
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

      {/* The rest of the filters from the distinct filterOptions, 
          but we only have partial data in 'questions' on mobile unless we store them. 
          We'll do same approach: gather from 'state.filterOptions' to get all. */}
      {filterTypes.map((fk) => {
        // we read from state.filterOptions
        const distinctVals = state.filterOptions[fk] || []
        return (
          <div key={fk}>
            <p className="font-semibold mb-2">
              {fk.charAt(0).toUpperCase() + fk.slice(1)}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto border p-2 rounded-md">
              {distinctVals.map((val) => (
                <label key={val} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={state.filters[fk].includes(val)}
                    onChange={() => handleArrayFilterChange(fk, val)}
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

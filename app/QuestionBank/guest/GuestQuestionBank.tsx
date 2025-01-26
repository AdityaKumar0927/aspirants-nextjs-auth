"use client"

import React, {
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

// Icons
import {
  Search,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Flag,
  CheckCircle2,
  ChevronDown,
} from "lucide-react"

// Reuse your shared Question component
import Question from "@/components/shared/Question"
// Reuse your Popover if needed
import Popover from "@/components/shared/popover"

// ------------------------------------------------------------
// 1) Enums / Types
// ------------------------------------------------------------
enum ViewMode {
  LIST = "list",
  SINGLE = "single",
}

interface QuestionType {
  id: number
  questionId?: string
  text?: string
  exam?: string
  subject?: string
  topic?: string
  subtopic?: string
  difficulty?: string
  year?: number
  type?: string
  options?: string[]
  correctOption?: string
  // We'll handle "completed"/"reviewed" locally for a guest
}

interface FilterOptionsType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
}

interface FiltersType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
  status: string // "all" | "complete" | "review" | "incomplete"
}

interface DropdownsType {
  exams: boolean
  subjects: boolean
  topics: boolean
  subtopics: boolean
  difficulties: boolean
  years: boolean
  types: boolean
}

// State shape
interface StateType {
  loading: boolean
  viewMode: ViewMode

  // The subset of questions from /api/questions (paginated)
  questions: QuestionType[]

  // Distinct filter sets from /api/filters
  filterOptions: FilterOptionsType

  // The user’s chosen filters
  filters: FiltersType

  // Popover open states
  dropdowns: DropdownsType

  // local search text
  searchQuery: string

  // Local progress data (only stored in localStorage)
  feedback: Record<string, string>        // questionId => "correct"/"incorrect"
  selectedOptions: Record<string, string> // questionId => chosen MCQ
  reviewed: Record<string, boolean>       // questionId => flagged
  completed: Record<string, boolean>      // questionId => done
  notes: Record<string, string>           // questionId => note
  showMarkscheme: Record<string, boolean> // questionId => markscheme visible

  // Pagination
  currentPage: number
  pageSize: number
  totalCount: number
}

type ActionType =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_DROPDOWNS"; payload: { key: keyof DropdownsType; value: boolean } }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_REVIEWED"; payload: Record<string, boolean> }
  | { type: "SET_COMPLETED"; payload: Record<string, boolean> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_TOTAL_COUNT"; payload: number }

const initialState: StateType = {
  loading: true,
  viewMode: ViewMode.LIST,
  questions: [],
  filterOptions: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
  },
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
  dropdowns: {
    exams: false,
    subjects: false,
    topics: false,
    subtopics: false,
    difficulties: false,
    years: false,
    types: false,
  },
  searchQuery: "",
  feedback: {},
  selectedOptions: {},
  reviewed: {},
  completed: {},
  notes: {},
  showMarkscheme: {},

  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
}

// Helper for local fuzzy search
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// Main reducer
function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: action.payload }
    case "SET_DROPDOWNS":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [action.payload.key]: action.payload.value,
        },
      }
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload }
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload }
    case "SET_REVIEWED":
      return { ...state, reviewed: action.payload }
    case "SET_COMPLETED":
      return { ...state, completed: action.payload }
    case "SET_NOTES":
      return { ...state, notes: action.payload }
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload }
    default:
      return state
  }
}

export default function GuestQuestionBank() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [singleIndex, setSingleIndex] = React.useState(0)
  const [navigatorOpen, setNavigatorOpen] = React.useState(false)
  const [filtersOpenMobile, setFiltersOpenMobile] = React.useState(false)
  const { toast } = useToast()

  // On mount, if window < 768 => single view
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.SINGLE })
    }
  }, [])

  // (A) Fetch distinct filter options from /api/filters
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch filter options.")
      const data: FilterOptionsType = await res.json()
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data })
    } catch (err) {
      console.error("Error fetching filter options:", err)
      toast({
        title: "Error",
        description: "Unable to load filter fields. Using minimal approach.",
        variant: "destructive",
      })
    }
  }, [toast])

  React.useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // (B) Fetch a subset of questions from /api/questions using pagination + filters
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const page = state.currentPage
      const pageSize = state.pageSize

      // Gather filters
      const { exams, subjects, topics, subtopics, difficulties, years, types } = state.filters

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

      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error("Failed to fetch questions. " + txt)
      }

      const result = await res.json()

      let data: QuestionType[] = []
      let totalCount = 0

      // If your /api/questions returns { data, totalCount, ... }:
      if (Array.isArray(result)) {
        // Possibly no pagination info was returned
        data = result
        totalCount = data.length
      } else {
        data = result.data ?? []
        totalCount = result.totalCount ?? 0
      }

      // Sort ascending by questionId numeric part
      data = data.sort((a, b) => {
        const aId = a.questionId?.match(/\d+/)?.[0] || "0"
        const bId = b.questionId?.match(/\d+/)?.[0] || "0"
        return parseInt(aId, 10) - parseInt(bId, 10)
      })

      // If needed, we add a local numeric "id"
      data = data.map((q, idx) => ({ ...q, id: idx + 1 }))

      dispatch({ type: "SET_QUESTIONS", payload: data })
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Could not load questions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [toast, state.currentPage, state.pageSize, state.filters])

  // Run on mount & whenever page/filters change
  React.useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // (C) Load local progress from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("guestQnBank")
    if (saved) {
      const obj = JSON.parse(saved)
      dispatch({ type: "SET_FEEDBACK", payload: obj.feedback || {} })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: obj.selectedOptions || {} })
      dispatch({ type: "SET_REVIEWED", payload: obj.reviewed || {} })
      dispatch({ type: "SET_COMPLETED", payload: obj.completed || {} })
      dispatch({ type: "SET_NOTES", payload: obj.notes || {} })
      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: obj.showMarkscheme || {} })
    }
  }, [])

  // (D) Whenever local data changes, save to localStorage
  React.useEffect(() => {
    const stored = {
      feedback: state.feedback,
      selectedOptions: state.selectedOptions,
      reviewed: state.reviewed,
      completed: state.completed,
      notes: state.notes,
      showMarkscheme: state.showMarkscheme,
    }
    localStorage.setItem("guestQnBank", JSON.stringify(stored))
  }, [
    state.feedback,
    state.selectedOptions,
    state.reviewed,
    state.completed,
    state.notes,
    state.showMarkscheme,
  ])

  // (E) local searching + status filter in the subset
  const filteredQuestions = useMemo(() => {
    const s = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      const fields = [q.text, q.exam, q.subject, q.topic, q.subtopic, q.type]
      const matchesSearch = fields.some((f) => f && fuzzyContains(f, s))

      const qid = q.questionId ?? ""
      let matchesStatus = true
      if (state.filters.status === "complete") {
        if (!state.completed[qid]) matchesStatus = false
      } else if (state.filters.status === "review") {
        if (!state.reviewed[qid]) matchesStatus = false
      } else if (state.filters.status === "incomplete") {
        if (state.completed[qid]) matchesStatus = false
      }

      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.completed, state.reviewed, state.filters.status, state.searchQuery])

  // (F) local stats for "progress" (purely local)
  const localStats = useMemo(() => {
    const total = state.questions.length
    let answered = 0
    let forReview = 0
    state.questions.forEach((q) => {
      const qid = q.questionId ?? ""
      if (state.reviewed[qid]) forReview++
      if (state.feedback[qid] === "correct" || state.completed[qid]) answered++
    })
    const notAnswered = total - answered - forReview
    const progress = total > 0 ? (answered / total) * 100 : 0
    return { total, answered, forReview, notAnswered, progress }
  }, [state.questions, state.reviewed, state.completed, state.feedback])

  // Basic pagination UI
  const totalPages = Math.ceil(state.totalCount / state.pageSize)
  function handlePageChange(newPage: number) {
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
  }

  // Slice out filtered results (optional). 
  // If you want to show "list" beyond the page, you might just show filteredQuestions directly 
  // or do actual server-side pagination. Here we show filtered results from the page.
  const displayQuestions = filteredQuestions

  // SINGLE or LIST
  const [singleQuestionIndex, setSingleQuestionIndex] = React.useState(0)

  if (state.loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="text-3xl mb-4">Guest Question Bank</h1>
          <Skeleton count={5} height={60} />
        </div>
      </div>
    )
  }

  // SINGLE VIEW
  if (state.viewMode === ViewMode.SINGLE) {
    if (!displayQuestions.length) {
      return (
        <div className="p-4 min-h-screen">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}
          >
            Switch to List View
          </Button>
          <p className="mt-4 text-red-400">No questions found for these filters.</p>
        </div>
      )
    }
    const q = displayQuestions[singleQuestionIndex]
    const qid = q.questionId ?? ""

    return (
      <div className="p-4 min-h-screen w-full flex justify-center">
        <div className="max-w-xl w-full">
          <div className="flex justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}
            >
              List View
            </Button>

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
                  <FilterPanelMobile state={state} dispatch={dispatch} />
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <span>{singleQuestionIndex + 1} / {displayQuestions.length}</span>
          </div>

          <Question
            key={qid}
            question={q}
            feedback={state.feedback[qid] || ""}
            selectedOption={state.selectedOptions[qid] || ""}
            numericalAnswer=""
            // MCQ
            handleOptionClick={(questionId, option, correctOption) => {
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
            }}
            // Numeric
            handleNumericalSubmit={(questionId, userAns, correctAns) => {
              const isCorrect = userAns === correctAns
              dispatch({
                type: "SET_FEEDBACK",
                payload: {
                  ...state.feedback,
                  [questionId]: isCorrect ? "correct" : "incorrect",
                },
              })
            }}
            handleNumericalChange={() => {}}
            // Flag
            handleMarkForReview={(questionId) => {
              const old = { ...state.reviewed }
              old[questionId] = !old[questionId]
              dispatch({ type: "SET_REVIEWED", payload: old })
            }}
            // Complete
            handleMarkComplete={(questionId) => {
              const old = { ...state.completed }
              old[questionId] = !old[questionId]
              dispatch({ type: "SET_COMPLETED", payload: old })
            }}
            isMarkedForReview={!!state.reviewed[qid]}
            isMarkedComplete={!!state.completed[qid]}
            showMarkscheme={!!state.showMarkscheme[qid]}
            handleMarkschemeToggle={(questionId) => {
              const copy = { ...state.showMarkscheme }
              copy[questionId] = !copy[questionId]
              dispatch({ type: "SET_SHOW_MARKSCHEME", payload: copy })
            }}
            markschemesDisabled={false}
            // Reset
            handleResetQuestion={(questionId) => {
              const newFb = { ...state.feedback }
              delete newFb[questionId]
              const newSel = { ...state.selectedOptions }
              delete newSel[questionId]
              const newRev = { ...state.reviewed, [questionId]: false }
              const newComp = { ...state.completed, [questionId]: false }
              dispatch({ type: "SET_FEEDBACK", payload: newFb })
              dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSel })
              dispatch({ type: "SET_REVIEWED", payload: newRev })
              dispatch({ type: "SET_COMPLETED", payload: newComp })
            }}
            note={state.notes[qid] || ""}
            handleNoteChange={(nid, val) => {
              const cp = { ...state.notes, [nid]: val }
              dispatch({ type: "SET_NOTES", payload: cp })
            }}
            handleDeleteNote={async (nid) => {
              const cp = { ...state.notes }
              delete cp[nid]
              dispatch({ type: "SET_NOTES", payload: cp })
            }}
            userId="guest"
            totalQuestions={displayQuestions.length}
            currentQuestionIndex={singleQuestionIndex}
            handleQuestionChange={() => {}}
          />

          <div className="flex justify-between mt-4">
            <Button
              onClick={() => setSingleQuestionIndex(Math.max(0, singleQuestionIndex - 1))}
              disabled={singleQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <Button
              onClick={() => setSingleQuestionIndex(Math.min(displayQuestions.length - 1, singleQuestionIndex + 1))}
              disabled={singleQuestionIndex === displayQuestions.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  return (
    <TooltipProvider>
      <div className="p-4 min-h-screen w-full">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl mb-2">Guest Question Bank</h1>

          <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900">Guest Access</h3>
              <p className="text-sm text-blue-700">
                Explore questions as a guest. Progress is stored locally only.
              </p>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="block sm:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh]">
                  <FilterPanelMobile state={state} dispatch={dispatch} />
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
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
                    {displayQuestions.map((q, idx) => {
                      const qid = q.questionId ?? ""
                      const isCorrect = state.feedback[qid] === "correct"
                      return (
                        <Button
                          key={qid}
                          variant={isCorrect ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            // no real "page jump" here, but if you had multi-page you'd do setCurrentPage
                            const el = document.getElementById(`question-${qid}`)
                            setNavigatorOpen(false)
                            if (el) {
                              setTimeout(() => {
                                el.scrollIntoView({ behavior: "smooth", block: "start" })
                              }, 200)
                            }
                          }}
                          className={`w-10 h-10 ${
                            isCorrect
                              ? "bg-green-100 border-green-500 text-green-700"
                              : state.reviewed[qid]
                              ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                              : ""
                          }`}
                        >
                          {idx + 1}
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop status row */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all","complete","review","incomplete"].map((st) => (
              <Button
                key={st}
                variant={state.filters.status === st ? "default" : "outline"}
                onClick={() =>
                  dispatch({
                    type: "SET_FILTERS",
                    payload: { ...state.filters, status: st },
                  })
                }
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Button>
            ))}
          </div>

          {/* Desktop popovers (exams, subjects, etc.) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(["exams","subjects","topics","subtopics","difficulties","years","types"] as (keyof FilterOptionsType)[]).map((filterKey) => {
              const distinctVals = state.filterOptions[filterKey] || []
              return (
                <Popover
                  key={filterKey}
                  content={
                    <div className="w-full bg-white border rounded-md p-2 sm:w-80">
                      <Input placeholder={`Search ${filterKey}...`} className="mb-2" />
                      <div className="max-h-60 overflow-y-auto">
                        {distinctVals.map((val) => (
                          <div key={val} className="flex items-center px-2 py-1">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={state.filters[filterKey].includes(val)}
                              onChange={() => {
                                const arr = state.filters[filterKey]
                                const isIn = arr.includes(val)
                                let newArr
                                if (isIn) {
                                  newArr = arr.filter((x) => x !== val)
                                } else {
                                  newArr = [...arr, val]
                                }
                                dispatch({
                                  type: "SET_FILTERS",
                                  payload: { ...state.filters, [filterKey]: newArr },
                                })
                              }}
                            />
                            <label>{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  openPopover={state.dropdowns[filterKey]}
                  setOpenPopover={(open) => {
                    dispatch({
                      type: "SET_DROPDOWNS",
                      payload: { key: filterKey, value: !!open },
                    })
                  }}
                >
                  <Button
                    variant="outline"
                    className="flex items-center justify-between w-36"
                    onClick={() => {
                      const was = state.dropdowns[filterKey]
                      dispatch({
                        type: "SET_DROPDOWNS",
                        payload: { key: filterKey, value: !was },
                      })
                    }}
                  >
                    {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </Popover>
              )
            })}
          </div>

          {/* Local progress card */}
          <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-4">Guest Question Progress</h3>
              {(() => {
                const { total, answered, forReview, notAnswered, progress } = localStats
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Overall Progress</span>
                      <span className="text-sm text-blue-700">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center p-2 bg-blue-100 rounded-md">
                        <HelpCircle className="mr-2 text-blue-600" />
                        <div>
                          <p className="text-lg text-blue-800">{notAnswered}</p>
                          <p className="text-sm text-blue-600">Not Answered</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 bg-green-100 rounded-md">
                        <CheckCircle2 className="mr-2 text-green-600" />
                        <div>
                          <p className="text-lg text-green-800">{answered}</p>
                          <p className="text-sm text-green-600">Answered</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 bg-yellow-100 rounded-md">
                        <Flag className="mr-2 text-yellow-600" />
                        <div>
                          <p className="text-lg text-yellow-800">{forReview}</p>
                          <p className="text-sm text-yellow-600">For Review</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {displayQuestions.length > 0 ? (
            <>
              {displayQuestions.map((question, i) => {
                const qid = question.questionId ?? ""
                return (
                  <Question
                    key={qid}
                    question={question}
                    feedback={state.feedback[qid] || ""}
                    selectedOption={state.selectedOptions[qid] || ""}
                    numericalAnswer=""
                    handleOptionClick={(qId, option, correct) => {
                      const isCorrect = option === correct
                      dispatch({
                        type: "SET_FEEDBACK",
                        payload: { ...state.feedback, [qId]: isCorrect ? "correct" : "incorrect" },
                      })
                      dispatch({
                        type: "SET_SELECTED_OPTIONS",
                        payload: { ...state.selectedOptions, [qId]: option },
                      })
                    }}
                    handleNumericalSubmit={(qId, userAns, correctAns) => {
                      const isCorrect = userAns === correctAns
                      dispatch({
                        type: "SET_FEEDBACK",
                        payload: { ...state.feedback, [qId]: isCorrect ? "correct" : "incorrect" },
                      })
                    }}
                    handleNumericalChange={() => {}}
                    handleMarkForReview={(qId) => {
                      const old = { ...state.reviewed }
                      old[qId] = !old[qId]
                      dispatch({ type: "SET_REVIEWED", payload: old })
                    }}
                    handleMarkComplete={(qId) => {
                      const old = { ...state.completed }
                      old[qId] = !old[qId]
                      dispatch({ type: "SET_COMPLETED", payload: old })
                    }}
                    isMarkedForReview={!!state.reviewed[qid]}
                    isMarkedComplete={!!state.completed[qid]}
                    showMarkscheme={!!state.showMarkscheme[qid]}
                    handleMarkschemeToggle={(qId) => {
                      const cp = { ...state.showMarkscheme }
                      cp[qId] = !cp[qId]
                      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: cp })
                    }}
                    markschemesDisabled={false}
                    handleResetQuestion={(qId) => {
                      const newFb = { ...state.feedback }
                      delete newFb[qId]
                      const newSel = { ...state.selectedOptions }
                      delete newSel[qId]
                      const newRev = { ...state.reviewed, [qId]: false }
                      const newComp = { ...state.completed, [qId]: false }
                      dispatch({ type: "SET_FEEDBACK", payload: newFb })
                      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSel })
                      dispatch({ type: "SET_REVIEWED", payload: newRev })
                      dispatch({ type: "SET_COMPLETED", payload: newComp })
                    }}
                    note={state.notes[qid] || ""}
                    handleNoteChange={(nid, val) => {
                      const cp = { ...state.notes, [nid]: val }
                      dispatch({ type: "SET_NOTES", payload: cp })
                    }}
                    handleDeleteNote={async (nid) => {
                      const cp = { ...state.notes }
                      delete cp[nid]
                      dispatch({ type: "SET_NOTES", payload: cp })
                    }}
                    userId="guest"
                    totalQuestions={displayQuestions.length}
                    currentQuestionIndex={i}
                    handleQuestionChange={() => {}}
                  />
                )
              })}

              {/* Simple Pagination Controls for multiple pages */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-4 items-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      dispatch({ type: "SET_CURRENT_PAGE", payload: Math.max(1, state.currentPage - 1) })
                    }
                    disabled={state.currentPage === 1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Prev Page
                  </Button>
                  <p className="text-sm">
                    Page {state.currentPage} of {totalPages}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      dispatch({ type: "SET_CURRENT_PAGE", payload: Math.min(totalPages, state.currentPage + 1) })
                    }
                    disabled={state.currentPage === totalPages}
                  >
                    Next Page
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-400">No questions found for these filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// The mobile filter panel
function FilterPanelMobile({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const statuses = ["all","complete","review","incomplete"]
  const filterKeys = [
    "exams",
    "subjects",
    "topics",
    "subtopics",
    "difficulties",
    "years",
    "types",
  ] as (keyof FilterOptionsType)[]

  function handleStatusChange(st: string) {
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, status: st },
    })
  }

  function toggleFilterValue(fk: keyof FilterOptionsType, val: string) {
    const arr = state.filters[fk]
    const isIn = arr.includes(val)
    let newArr
    if (isIn) {
      newArr = arr.filter((x) => x !== val)
    } else {
      newArr = [...arr, val]
    }
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [fk]: newArr },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold mb-2">Question Status</p>
        <div className="flex space-x-2 flex-wrap">
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

      {filterKeys.map((fk) => {
        const distinctVals = state.filterOptions[fk] || []
        return (
          <div key={fk}>
            <p className="font-semibold mb-2">
              {fk.charAt(0).toUpperCase() + fk.slice(1)}
            </p>
            <div className="border p-2 rounded-md max-h-40 overflow-y-auto">
              {distinctVals.map((val) => (
                <label key={val} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={state.filters[fk].includes(val)}
                    onChange={() => toggleFilterValue(fk, val)}
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

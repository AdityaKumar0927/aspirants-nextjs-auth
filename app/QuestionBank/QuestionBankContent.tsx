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
import Question from "@/components/shared/Question"
import Popover from "@/components/shared/popover"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  List,
  Filter,
  HelpCircle,
  Flag,
} from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
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
  diagramUrl?: string
  exam?: string
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

// Distinct filter options
interface FilterOptionsType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
}

interface GlobalStats {
  total: number
  completed: number
  reviewed: number
  notAnswered: number
}

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

// simple fuzzy search
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

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

  globalStats: {
    total: 0,
    completed: 0,
    reviewed: 0,
    notAnswered: 0,
  },
}

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

export default function QuestionBankContent() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const { toast } = useToast()

  const [viewMode, setViewMode] = React.useState<ViewMode>(ViewMode.LIST)
  const [singleIndex, setSingleIndex] = React.useState(0)
  const [filtersOpenMobile, setFiltersOpenMobile] = React.useState(false)
  const [navigatorOpen, setNavigatorOpen] = React.useState(false) // track open state for navigator

  // If small => single
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode(ViewMode.SINGLE)
    }
  }, [])

  /**
   * fetchSmartFilters: fetch updated sub-filter options
   * from your server based on the current state.filters.
   * The server returns only those subjects / topics / years
   * that are valid under the chosen exam(s).
   */
  const fetchSmartFilters = React.useCallback(async () => {
    try {
      // e.g. /api/filters/smart?exam=SSC,UPSC&subject=English
      const { exams, subjects, topics, subtopics, difficulties, years, types } = state.filters

      function arrToComma(arr: string[]) {
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

      const url = `/api/filters/smart?${params.toString()}`
      console.log("Fetching smart filters =>", url)

      const resp = await fetch(url)
      if (!resp.ok) {
        throw new Error(`Smart filters fetch failed: ${resp.status}`)
      }
      const newOpts = await resp.json() as FilterOptionsType
      // newOpts.exams, newOpts.subjects, ...
      dispatch({ type: "SET_FILTER_OPTIONS", payload: newOpts })
    } catch (err) {
      console.error("Error fetchSmartFilters:", err)
      // fallback or keep existing
    }
  }, [state.filters])

  // (A) fetch initial (non-slim) filter options
  const fetchFilterOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch distinct filter fields.")
      const raw = await res.json()

      const data: FilterOptionsType = {
        exams: raw.exams ?? [],
        subjects: raw.subjects ?? [],
        topics: raw.topics ?? [],
        subtopics: raw.subtopics ?? [],
        difficulties: raw.difficulties ?? [],
        years: raw.years ?? [],
        types: raw.types ?? [],
      }
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

  // (B) fetch global stats
  const fetchGlobalStats = React.useCallback(async () => {
    try {
      // If you want the stats to reflect the *current filters*, you can pass them
      // e.g. /api/questions/stats?exam=..., subject=...
      // That way, you get a relevant count of total, completed, etc. under the current filter.
      // Or just fetch stats for entire DB if you prefer:
      const res = await fetch("/api/questions/stats", { cache: "no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Failed to fetch stats: ${txt}`)
      }
      const raw = await res.json() as any

      // We'll assume raw => { totalQuestions, completed, reviewed, notAnswered }
      // If you only have totalQuestions, you can do:
      const stats: GlobalStats = {
        total: raw.totalQuestions || 0,
        completed: raw.completed || 0,
        reviewed: raw.reviewed || 0,
        notAnswered: raw.notAnswered || 0,
      }
      dispatch({ type: "SET_GLOBAL_STATS", payload: stats })
    } catch (err) {
      console.error("Error fetching global stats:", err)
    }
  }, [])

  // (C) fetch questions
  const fetchQuestions = React.useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const { currentPage, pageSize, filters } = state
      const { exams, subjects, topics, subtopics, difficulties, years, types } = filters

      function arrToComma(arr: string[]) {
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

      // Also pass status if your server supports it, or keep it local
      // e.g. if (filters.status !== "all") ...
      // We'll skip that here.

      params.set("page", String(currentPage))
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

      // sort ascending by numeric portion
      data = data.sort((a,b) => {
        const aId = a.questionId?.match(/\d+/)?.[0] || "0"
        const bId = b.questionId?.match(/\d+/)?.[0] || "0"
        return parseInt(aId,10) - parseInt(bId,10)
      })

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

  // Initial load
  React.useEffect(() => {
    fetchFilterOptions()
    fetchGlobalStats()
  }, [fetchFilterOptions, fetchGlobalStats])

  // Each time filters change, we want to:
  //   1) fetch updated "smart" subfilters
  //   2) fetch updated questions
  //   3) fetch updated stats
  React.useEffect(() => {
    fetchSmartFilters()
    fetchQuestions()
    fetchGlobalStats()
  }, [state.filters, state.currentPage, fetchSmartFilters, fetchQuestions, fetchGlobalStats])

  // handle page
  function handlePageChange(page: number) {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }

  // mark complete
  const handleMarkComplete = React.useCallback(async (questionId: string, newVal?: boolean)=>{
    const val = newVal ?? true
    try {
      await fetch("/api/questions", {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ questionId, completed: val }),
      })
      dispatch({
        type:"SET_QUESTIONS",
        payload: state.questions.map(q=>
          q.questionId===questionId ? { ...q, completed:val } : q
        ),
      })
    } catch(err) {
      console.error("Error marking complete:", err)
    }
  }, [state.questions])

  // mark for review
  const handleMarkForReview = React.useCallback(async (questionId: string, newVal?: boolean)=>{
    const val = newVal ?? true
    try {
      await fetch("/api/questions", {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ questionId, reviewed: val }),
      })
      dispatch({
        type:"SET_QUESTIONS",
        payload: state.questions.map(q=>
          q.questionId===questionId ? { ...q, reviewed:val } : q
        ),
      })
    } catch(err) {
      console.error("Error marking review:", err)
    }
  }, [state.questions])

  // MCQ
  const handleOptionClick = React.useCallback((questionId: string, option: string, correctOption: string)=>{
    const isCorrect = option===correctOption
    dispatch({
      type:"SET_FEEDBACK",
      payload:{ ...state.feedback, [questionId]: isCorrect?"correct":"incorrect" },
    })
    dispatch({
      type:"SET_SELECTED_OPTIONS",
      payload:{ ...state.selectedOptions, [questionId]: option },
    })
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map(q=>
        q.questionId===questionId ? { ...q, completed:true } : q
      ),
    })
  }, [state.feedback, state.selectedOptions, state.questions])

  // numeric
  const handleNumericalSubmit = React.useCallback((questionId: string, userAns: string, correctAns: string)=>{
    const isCorrect = userAns===correctAns
    dispatch({
      type:"SET_FEEDBACK",
      payload:{ ...state.feedback, [questionId]: isCorrect?"correct":"incorrect" },
    })
    dispatch({
      type:"SET_NUMERICAL_ANSWERS",
      payload:{ ...state.numericalAnswers, [questionId]: userAns },
    })
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map(q=>
        q.questionId===questionId ? { ...q, completed:true } : q
      ),
    })
  }, [state.feedback, state.numericalAnswers, state.questions])

  // reset
  const handleResetQuestion = React.useCallback(async (questionId: string)=>{
    dispatch({
      type:"SET_FEEDBACK",
      payload:{ ...state.feedback, [questionId]: undefined },
    })
    dispatch({
      type:"SET_SELECTED_OPTIONS",
      payload:{ ...state.selectedOptions, [questionId]: undefined },
    })
    dispatch({
      type:"SET_NUMERICAL_ANSWERS",
      payload:{ ...state.numericalAnswers, [questionId]: undefined },
    })
    dispatch({
      type:"SET_QUESTIONS",
      payload: state.questions.map((q)=>
        q.questionId===questionId ? { ...q, completed:false, reviewed:false } : q
      ),
    })
    try {
      await fetch("/api/questions", {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ questionId, completed:false, reviewed:false }),
      })
    } catch(err) {
      console.error("Error resetting question:", err)
    }
  }, [state.feedback, state.selectedOptions, state.numericalAnswers, state.questions])

  // local search + local status
  const filteredQuestions = useMemo(()=>{
    const s = state.searchQuery.toLowerCase()
    return state.questions.filter(q=>{
      const textFields = [q.text, q.exam, q.subject, q.topic, q.subtopic]
      const matchesSearch = textFields.some(f=> f && fuzzyContains(f, s))

      let matchesStatus = true
      const st = state.filters.status
      if (st==="review" && !q.reviewed) matchesStatus=false
      else if (st==="complete" && !q.completed) matchesStatus=false
      else if (st==="incomplete" && q.completed) matchesStatus=false

      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.filters.status, state.searchQuery])

  // LOADING SKELETON
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

  // SINGLE VIEW
  if (viewMode === ViewMode.SINGLE) {
    if (!filteredQuestions.length) {
      return (
        <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">
            <Button variant="outline" onClick={()=> setViewMode(ViewMode.LIST)}>
              List View
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
          {/* top row */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={()=> setViewMode(ViewMode.LIST)}>
              List View
            </Button>

            {/* Mobile filters */}
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2 inline-flex items-center">
                  <Filter className="mr-2 h-4 w-4"/>
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  flex flex-col
                "
              >
                <FiltersDialogMobile
                  open={filtersOpenMobile}
                  onOpenChange={setFiltersOpenMobile}
                  state={state}
                  dispatch={dispatch}
                />
              </DialogContent>
            </Dialog>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {singleIndex + 1} / {filteredQuestions.length}
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
                showMarkscheme={state.showMarkscheme[currentQ.questionId] || false}
                handleOptionClick={handleOptionClick}
                handleNumericalSubmit={handleNumericalSubmit}
                handleNumericalChange={(qId, val)=>{
                  dispatch({
                    type:"SET_NUMERICAL_ANSWERS",
                    payload:{ ...state.numericalAnswers, [qId]: val },
                  })
                }}
                handleMarkschemeToggle={(qId)=>{
                  dispatch({
                    type:"SET_SHOW_MARKSCHEME",
                    payload:{
                      ...state.showMarkscheme,
                      [qId]: !state.showMarkscheme[qId],
                    },
                  })
                }}
                handleMarkForReview={handleMarkForReview}
                handleMarkComplete={handleMarkComplete}
                handleResetQuestion={handleResetQuestion}
                isMarkedForReview={!!currentQ.reviewed}
                isMarkedComplete={!!currentQ.completed}
                markschemesDisabled={false}
                note=""
                handleNoteChange={()=>{}}
                handleDeleteNote={()=>Promise.resolve()}
                userId="guest"
                totalQuestions={filteredQuestions.length}
                currentQuestionIndex={singleIndex}
                handleQuestionChange={()=>{}}
              />
            </motion.div>
          </AnimatePresence>

          {/* nav buttons */}
          <div className="flex justify-between">
            <Button
              onClick={()=> setSingleIndex(Math.max(0,singleIndex-1))}
              disabled={singleIndex===0}
            >
              <ChevronLeft className="mr-1 h-4 w-4"/>
              Prev
            </Button>
            <Button
              onClick={()=> setSingleIndex(Math.min(filteredQuestions.length-1, singleIndex+1))}
              disabled={singleIndex===filteredQuestions.length-1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          {/* Switch to single */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={()=> setViewMode(ViewMode.SINGLE)}>
              Switch to Single View
            </Button>
          </div>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl">
            Question Bank
          </h1>

          {/* Search + mobile filters + navigator */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e)=>
                  dispatch({ type:"SET_SEARCH_QUERY", payload:e.target.value })
                }
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"/>
            </div>

            {/* mobile filters */}
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 sm:hidden flex items-center"
                >
                  <Filter className="mr-2 h-4 w-4"/>
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  flex flex-col
                "
              >
                <FiltersDialogMobile
                  open={filtersOpenMobile}
                  onOpenChange={setFiltersOpenMobile}
                  state={state}
                  dispatch={dispatch}
                />
              </DialogContent>
            </Dialog>

            {/* question navigator (desktop) */}
            <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen} /* disableFocusLock etc. */>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 hidden sm:flex"
                >
                  <List className="mr-2 h-4 w-4" />
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100"
                // We can disableFocusLock to avoid jumping scroll
                // or just avoid forcibly focusing the first input
                // portal = ...
              >
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((q, index) => {
                      const absoluteIndex = (state.currentPage - 1)*state.pageSize + index
                      const displayNum = absoluteIndex + 1
                      return (
                        <Button
                          key={q.questionId}
                          variant={q.completed ? "default":"outline"}
                          size="sm"
                          onClick={()=>{
                            const el = document.getElementById(`question-${q.questionId}`)
                            if (el) {
                              el.scrollIntoView({ behavior:"smooth", block:"start" })
                            }
                          }}
                          className={`
                            w-10 h-10 dark:border-gray-700
                            ${q.completed
                              ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                              : q.reviewed
                              ? "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : ""
                            }
                          `}
                        >
                          {displayNum}
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop row for (all/complete/review/incomplete) with distinct styling */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all","complete","review","incomplete"].map((st) => {
              const isActive = (state.filters.status === st)
              return (
                <button
                  key={st}
                  onClick={()=>{
                    dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, status: st } })
                  }}
                  className={`
                    px-4 py-2 rounded-md transition-colors
                    ${isActive
                      ? `
                        border border-green-500 
                        bg-green-50 text-green-700
                      `
                      : `
                        bg-white dark:bg-gray-800
                        border border-gray-300 dark:border-gray-600
                        hover:border-gray-700 dark:hover:border-gray-500
                        text-gray-500 dark:text-gray-100
                      `
                    }
                  `}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              )
            })}
          </div>

          {/* Desktop filter popovers */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(["exams","subjects","topics","subtopics","difficulties","years","types"] as FilterKey[]).map((filterType) => {
              const filterValues = state.filterOptions[filterType] || []
              const isOpen = state.dropdowns[filterType]
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
                        {filterValues.map((val) => {
                          const isSelected = state.filters[filterType].includes(val)
                          return (
                            <div key={val} className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={isSelected}
                                onChange={()=>{
                                  let newArr
                                  if (isSelected) {
                                    newArr = state.filters[filterType].filter(x=> x!==val)
                                  } else {
                                    newArr = [...state.filters[filterType], val]
                                  }
                                  dispatch({
                                    type:"SET_FILTERS",
                                    payload:{ ...state.filters, [filterType]: newArr },
                                  })
                                }}
                              />
                              <label
                                className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {val}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  }
                  align="start"
                  openPopover={isOpen}
                  setOpenPopover={(open)=>{
                    dispatch({
                      type:"SET_DROPDOWN",
                      payload:{ tag: filterType, value:!!open }
                    })
                  }}
                >
                  <button
                    onClick={()=>{
                      dispatch({
                        type:"SET_DROPDOWN",
                        payload:{ tag: filterType, value: !isOpen }
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
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all"/>
                  </button>
                </Popover>
              )
            })}
          </div>

          {/* The question progress card (with total, etc.) */}
          <Card className="
            bg-gradient-to-br from-gray-200 to-gray-100
            dark:from-gray-900 dark:to-gray-800
            text-gray-900 dark:text-gray-100
            border-gray-200 dark:border-gray-700
            mb-6
          ">
            <CardContent className="p-6">
              <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-200 mb-6">
                Question Progress
              </h2>
              <div className="space-y-6">
                {/* overall progress = (completed / total)*100 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    {state.globalStats.total > 0
                      ? Math.round((state.globalStats.completed / state.globalStats.total) * 100)
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

                {/* 4 tiles: total, answered, review, not answered */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* total */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5"/>
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                        {state.globalStats.total}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Total Questions
                      </p>
                    </div>
                  </div>

                  {/* answered (completed) */}
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
                      <Flag className="h-5 w-5"/>
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

                  {/* Not Answered */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-red-400 p-2 rounded-full bg-red-400/10">
                      <HelpCircle className="h-5 w-5"/>
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-red-600 dark:text-red-300">
                        {state.globalStats.notAnswered}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Not Answered
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {state.questions.length>0 ? (
            <>
              {filteredQuestions.map((q, index) => {
                const absoluteIndex = (state.currentPage - 1)*state.pageSize + index
                const displayNum = absoluteIndex + 1

                return (
                  <Question
                    key={q.questionId}
                    question={q}
                    feedback={state.feedback[q.questionId]}
                    selectedOption={state.selectedOptions[q.questionId]}
                    numericalAnswer={state.numericalAnswers[q.questionId]}
                    showMarkscheme={state.showMarkscheme[q.questionId] || false}
                    handleOptionClick={handleOptionClick}
                    handleNumericalSubmit={handleNumericalSubmit}
                    handleNumericalChange={(qId, val)=>{
                      dispatch({
                        type:"SET_NUMERICAL_ANSWERS",
                        payload:{ ...state.numericalAnswers, [qId]:val },
                      })
                    }}
                    handleMarkschemeToggle={(qId)=>{
                      dispatch({
                        type:"SET_SHOW_MARKSCHEME",
                        payload:{
                          ...state.showMarkscheme,
                          [qId]: !state.showMarkscheme[qId],
                        },
                      })
                    }}
                    handleMarkForReview={handleMarkForReview}
                    handleMarkComplete={handleMarkComplete}
                    handleResetQuestion={async (qid)=>{
                      // local reset
                      dispatch({
                        type:"SET_FEEDBACK",
                        payload:{ ...state.feedback, [qid]: undefined },
                      })
                      dispatch({
                        type:"SET_SELECTED_OPTIONS",
                        payload:{ ...state.selectedOptions, [qid]: undefined },
                      })
                      dispatch({
                        type:"SET_NUMERICAL_ANSWERS",
                        payload:{ ...state.numericalAnswers, [qid]: undefined },
                      })
                      dispatch({
                        type:"SET_QUESTIONS",
                        payload: state.questions.map(qq=>
                          qq.questionId===qid ? { ...qq, completed:false, reviewed:false } : qq
                        ),
                      })
                      // server
                      try {
                        await fetch("/api/questions", {
                          method:"PATCH",
                          headers:{ "Content-Type":"application/json" },
                          body: JSON.stringify({
                            questionId: qid,
                            completed:false,
                            reviewed:false,
                          }),
                        })
                      } catch(e) {
                        console.error("Error resetting question:", e)
                      }
                    }}
                    isMarkedForReview={q.reviewed||false}
                    isMarkedComplete={q.completed||false}
                    markschemesDisabled={false}
                    note=""
                    handleNoteChange={()=>{}}
                    handleDeleteNote={()=>Promise.resolve()}
                    userId="guest"
                    totalQuestions={state.totalCount}
                    currentQuestionIndex={displayNum - 1}
                    handleQuestionChange={()=>{}}
                  />
                )
              })}
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

/** MOBILE FILTERS DIALOG
 * Each time we toggle filters, we dispatch "SET_FILTERS".
 * Then the effect in the parent calls fetchSmartFilters + fetchQuestions + fetchGlobalStats.
 */
function FiltersDialogMobile({
  open,
  onOpenChange,
  state,
  dispatch,
}: {
  open: boolean
  onOpenChange: (val: boolean) => void
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const exams = state.filterOptions.exams || []
  const subjects = state.filterOptions.subjects || []
  const topics = state.filterOptions.topics || []
  const subtopics = state.filterOptions.subtopics || []
  const difficulties = state.filterOptions.difficulties || []
  const years = state.filterOptions.years || []
  const types = state.filterOptions.types || []

  function toggleFilter(key: FilterKey, val: string) {
    const old = state.filters[key]
    const isSel = old.includes(val)
    let newArr
    if (isSel) {
      newArr = old.filter(x=> x!==val)
    } else {
      newArr = [...old, val]
    }
    dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, [key]: newArr } })
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <DialogHeader className="mb-2">
        <DialogTitle>Filters</DialogTitle>
      </DialogHeader>

      <ScrollArea className="flex-grow">
        <div className="space-y-4 py-2 text-sm">
          {/* status row (all/complete/review/incomplete) on mobile */}
          <div>
            <p className="font-medium mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {["all","complete","review","incomplete"].map(st => {
                const active = (state.filters.status===st)
                return (
                  <Button
                    key={st}
                    size="sm"
                    onClick={()=>{
                      dispatch({
                        type:"SET_FILTERS",
                        payload:{ ...state.filters, status:st }
                      })
                    }}
                    className={`
                      ${active
                        ? "border border-green-500 bg-green-50 text-green-700"
                        : "border border-gray-300 dark:border-gray-700"
                      }
                    `}
                  >
                    {st.charAt(0).toUpperCase()+st.slice(1)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Exams */}
          <div>
            <p className="font-medium mb-2">Exams</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {exams.map(ex=> {
                const checked = state.filters.exams.includes(ex)
                return (
                  <label key={ex} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("exams", ex)}
                    />
                    <span>{ex}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Subjects */}
          <div>
            <p className="font-medium mb-2">Subjects</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {subjects.map(subj=> {
                const checked = state.filters.subjects.includes(subj)
                return (
                  <label key={subj} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("subjects", subj)}
                    />
                    <span>{subj}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Topics */}
          <div>
            <p className="font-medium mb-2">Topics</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {topics.map(t=> {
                const checked = state.filters.topics.includes(t)
                return (
                  <label key={t} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("topics", t)}
                    />
                    <span>{t}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Subtopics */}
          <div>
            <p className="font-medium mb-2">Subtopics</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {subtopics.map(s=> {
                const checked = state.filters.subtopics.includes(s)
                return (
                  <label key={s} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("subtopics", s)}
                    />
                    <span>{s}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Difficulties */}
          <div>
            <p className="font-medium mb-2">Difficulties</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {difficulties.map(d=> {
                const checked = state.filters.difficulties.includes(d)
                return (
                  <label key={d} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("difficulties", d)}
                    />
                    <span>{d}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Years */}
          <div>
            <p className="font-medium mb-2">Years</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {years.map(y=> {
                const checked = state.filters.years.includes(y)
                return (
                  <label key={y} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("years", y)}
                    />
                    <span>{y}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

          {/* Types */}
          <div>
            <p className="font-medium mb-2">Types</p>
            <ScrollArea className="max-h-40 border p-2 rounded-md dark:border-gray-700">
              {types.map(tp=> {
                const checked = state.filters.types.includes(tp)
                return (
                  <label key={tp} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=> toggleFilter("types", tp)}
                    />
                    <span>{tp}</span>
                  </label>
                )
              })}
            </ScrollArea>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}

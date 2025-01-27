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
  CheckCircle2,
} from "lucide-react"

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

// --------------------------------
// 1) Enums / Types
// --------------------------------
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
  status: string // "all"|"complete"|"review"|"incomplete"
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

interface StateType {
  loading: boolean
  viewMode: ViewMode

  // The paginated subset from /api/questions
  questions: QuestionType[]

  // Distinct filter sets from /api/filters
  filterOptions: FilterOptionsType

  // The user’s chosen filters
  filters: FiltersType

  // The popover open states
  dropdowns: DropdownsType

  // The search text
  searchQuery: string

  // Local progress
  feedback: Record<string, string>        // questionId => "correct"/"incorrect"
  selectedOptions: Record<string, string> // questionId => chosen MCQ letter
  reviewed: Record<string, boolean>       // questionId => flagged
  completed: Record<string, boolean>      // questionId => done
  notes: Record<string, string>           // questionId => note
  showMarkscheme: Record<string, boolean> // questionId => show/hide solution

  // Pagination
  currentPage: number
  pageSize: number
  totalCount: number // total # of questions in entire DB
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

// Fuzzy includes helper
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// --------------------------------
// 2) Reducer
// --------------------------------
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

// --------------------------------
// 3) Initial State
// --------------------------------
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

// --------------------------------
// 4) GuestQuestionBank
// --------------------------------
export default function GuestQuestionBank() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [singleIndex, setSingleIndex] = React.useState(0)
  const [navigatorOpen, setNavigatorOpen] = React.useState(false)
  const [filtersOpenMobile, setFiltersOpenMobile] = React.useState(false)
  const { toast } = useToast()

  // If window < 768 => single
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.SINGLE })
    }
  }, [])

  // (A) Fetch distinct filters
  const fetchFilterOptions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache:"no-store" })
      if (!res.ok) throw new Error("Failed to fetch filter options.")
      const data: FilterOptionsType = await res.json()
      dispatch({ type:"SET_FILTER_OPTIONS", payload:data })
    } catch (err) {
      console.error("Error fetching filter options:", err)
      toast({
        title: "Error",
        description: "Unable to load filter fields.",
        variant: "destructive",
      })
    }
  }, [toast])

  React.useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // (B) Fetch questions
  const fetchQuestions = React.useCallback(async () => {
    dispatch({ type:"SET_LOADING", payload:true })
    try {
      const { currentPage, pageSize, filters } = state
      const { exams, subjects, topics, subtopics, difficulties, years, types } = filters

      function arrToComma(arr: string[]) { return arr.join(",") }
      const params = new URLSearchParams()
      if (exams.length) params.set("exam", arrToComma(exams))
      if (subjects.length) params.set("subject", arrToComma(subjects))
      if (topics.length) params.set("topic", arrToComma(topics))
      if (subtopics.length) params.set("subtopic", arrToComma(subtopics))
      if (difficulties.length) params.set("difficulty", arrToComma(difficulties))
      if (years.length) params.set("year", arrToComma(years))
      if (types.length) params.set("type", arrToComma(types))

      params.set("page", String(currentPage))
      params.set("pageSize", String(pageSize))

      const url = `/api/questions?${params.toString()}`
      const res = await fetch(url, { cache:"no-store" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error("Failed to fetch questions. " + txt)
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

      // sort ascending by numeric portion of questionId
      data = data.sort((a,b) => {
        const aId = a.questionId?.match(/\d+/)?.[0] || "0"
        const bId = b.questionId?.match(/\d+/)?.[0] || "0"
        return parseInt(aId,10) - parseInt(bId,10)
      })

      // add local numeric ID
      data = data.map((q, i) => ({ ...q, id: i+1 }))

      dispatch({ type:"SET_QUESTIONS", payload:data })
      dispatch({ type:"SET_TOTAL_COUNT", payload:totalCount })
    } catch(err) {
      console.error(err)
      toast({
        title:"Error",
        description:"Could not load questions. Please try again later.",
        variant:"destructive",
      })
    } finally {
      dispatch({ type:"SET_LOADING", payload:false })
    }
  }, [toast, state.currentPage, state.pageSize, state.filters])

  React.useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // (C) load local progress
  React.useEffect(() => {
    const saved = localStorage.getItem("guestQnBank")
    if (saved) {
      const obj = JSON.parse(saved)
      dispatch({ type:"SET_FEEDBACK", payload: obj.feedback || {} })
      dispatch({ type:"SET_SELECTED_OPTIONS", payload: obj.selectedOptions || {} })
      dispatch({ type:"SET_REVIEWED", payload: obj.reviewed || {} })
      dispatch({ type:"SET_COMPLETED", payload: obj.completed || {} })
      dispatch({ type:"SET_NOTES", payload: obj.notes || {} })
      dispatch({ type:"SET_SHOW_MARKSCHEME", payload: obj.showMarkscheme || {} })
    }
  }, [])

  // (D) store local changes
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

  // (E) local searching + status
  const filteredQuestions = React.useMemo(() => {
    const s = state.searchQuery.toLowerCase()
    return state.questions.filter(q => {
      const fields = [q.text, q.exam, q.subject, q.topic, q.subtopic, q.type]
      const matchesSearch = fields.some(f => f && fuzzyContains(f, s))

      const qid = q.questionId ?? ""
      let matchesStatus = true
      if (state.filters.status==="complete") {
        if (!state.completed[qid]) matchesStatus=false
      } else if (state.filters.status==="review") {
        if (!state.reviewed[qid]) matchesStatus=false
      } else if (state.filters.status==="incomplete") {
        if (state.completed[qid]) matchesStatus=false
      }
      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.completed, state.reviewed, state.filters.status, state.searchQuery])

  // (F) local question progress
  const localStats = React.useMemo(() => {
    const totalDB = state.totalCount
    // answered => union of (completed + feedback==="correct")
    const answeredSet = new Set<string>()
    Object.entries(state.completed).forEach(([qid,val]) => {
      if (val) answeredSet.add(qid)
    })
    Object.entries(state.feedback).forEach(([qid, fb]) => {
      if (fb==="correct") answeredSet.add(qid)
    })
    const answered = answeredSet.size

    // flagged => reviewed
    const reviewSet = new Set<string>()
    Object.entries(state.reviewed).forEach(([qid,val]) => {
      if (val) reviewSet.add(qid)
    })
    const forReview = reviewSet.size

    const progressPct = totalDB>0 ? (answered/totalDB)*100 : 0
    return { total: totalDB, answered, forReview, progress: progressPct }
  }, [state.totalCount, state.completed, state.feedback, state.reviewed])

  // pagination
  const totalPages = Math.ceil(state.totalCount / state.pageSize)
  function handlePageChange(newPage: number) {
    dispatch({ type:"SET_CURRENT_PAGE", payload:newPage })
  }

  // single or list
  const [singleQuestionIndex, setSingleQuestionIndex] = React.useState(0)

  // If loading => skeleton
  if (state.loading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Guest Question Bank</h1>
          <div className="flex space-x-4 mb-6">
            <Skeleton height={40} width={120}/>
            <Skeleton height={40} width={120}/>
            <Skeleton height={40} width={120}/>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {[...Array(7)].map((_,i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton height={40} width={120}/>
              </div>
            ))}
          </div>
          <div>
            {[...Array(10)].map((_,i) => (
              <div key={i} className="mb-4 p-4 border rounded-md dark:border-gray-700">
                <Skeleton height={20} width={"80%"}/>
                <Skeleton height={20} width={"90%"}/>
                <Skeleton height={20} width={"60%"}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // SINGLE
  if (state.viewMode===ViewMode.SINGLE) {
    if (!filteredQuestions.length) {
      return (
        <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">
            <Button variant="outline" onClick={()=>dispatch({ type:"SET_VIEW_MODE", payload:ViewMode.LIST })}>
              Switch to List View
            </Button>
            <p className="mt-6 text-red-300">No questions found with these filters.</p>
          </div>
        </div>
      )
    }
    const currentQ = filteredQuestions[singleQuestionIndex]
    const qid = currentQ.questionId ?? ""

    return (
      <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-4 text-gray-900 dark:text-gray-100 flex justify-center">
        <div className="max-w-xl w-full">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={()=>dispatch({ type:"SET_VIEW_MODE", payload:ViewMode.LIST })}>
              List View
            </Button>

            {/* Full-screen mobile filters approach */}
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center ml-2">
                  <Filter className="mr-2 h-4 w-4"/>
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[600px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  flex flex-col
                "
                style={{ padding: 0, margin: 0 }}
              >
                {/* Top bar with close & submit */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                  {/* Close button */}
                  <button
                    onClick={() => setFiltersOpenMobile(false)}
                    className="text-sm text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <h2 className="text-base font-semibold tracking-tight">
                    Filters
                  </h2>

                  <button
                    onClick={() => {
                      // If you want to refetch questions after applying,
                      // do something like: fetchQuestions()
                      // or simply close
                      setFiltersOpenMobile(false)
                    }}
                    className="
                      text-sm px-3 py-1 
                      rounded 
                      bg-blue-600 hover:bg-blue-700 text-white
                    "
                  >
                    Submit
                  </button>
                </div>

                <ScrollArea className="flex-grow px-4 py-2">
                  <MobileFilterPanel state={state} dispatch={dispatch}/>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {singleIndex+1} / {filteredQuestions.length}
            </span>
          </div>

          <Question
            question={currentQ}
            feedback={state.feedback[qid] || ""}
            selectedOption={state.selectedOptions[qid] || ""}
            numericalAnswer=""
            handleOptionClick={(questionId, option, correctOption)=>{
              const isCorrect = option===correctOption
              dispatch({
                type:"SET_FEEDBACK",
                payload:{...state.feedback,[questionId]: isCorrect?"correct":"incorrect"}
              })
              dispatch({
                type:"SET_SELECTED_OPTIONS",
                payload:{...state.selectedOptions,[questionId]:option}
              })
            }}
            handleNumericalSubmit={(questionId, userAns, correctAns)=>{
              const isCorrect = (userAns===correctAns)
              dispatch({
                type:"SET_FEEDBACK",
                payload:{...state.feedback,[questionId]: isCorrect?"correct":"incorrect"}
              })
            }}
            handleNumericalChange={()=>{}}
            handleMarkForReview={(questionId)=>{
              const old = {...state.reviewed}
              old[questionId] = !old[questionId]
              dispatch({ type:"SET_REVIEWED", payload:old })
            }}
            handleMarkComplete={(questionId)=>{
              const old = {...state.completed}
              old[questionId] = !old[questionId]
              dispatch({ type:"SET_COMPLETED", payload:old })
            }}
            isMarkedForReview={!!state.reviewed[qid]}
            isMarkedComplete={!!state.completed[qid]}
            showMarkscheme={!!state.showMarkscheme[qid]}
            handleMarkschemeToggle={(questionId)=>{
              const cp = {...state.showMarkscheme}
              cp[questionId] = !cp[questionId]
              dispatch({ type:"SET_SHOW_MARKSCHEME", payload:cp })
            }}
            markschemesDisabled={false}
            handleResetQuestion={(questionId)=>{
              const fbCopy = {...state.feedback}
              delete fbCopy[questionId]
              const selCopy = {...state.selectedOptions}
              delete selCopy[questionId]
              const revCopy = {...state.reviewed,[questionId]: false}
              const compCopy = {...state.completed,[questionId]: false}
              dispatch({ type:"SET_FEEDBACK", payload: fbCopy })
              dispatch({ type:"SET_SELECTED_OPTIONS", payload: selCopy })
              dispatch({ type:"SET_REVIEWED", payload: revCopy })
              dispatch({ type:"SET_COMPLETED", payload: compCopy })
            }}
            note={state.notes[qid] || ""}
            handleNoteChange={(nid,val)=>{
              const cp = {...state.notes,[nid]:val}
              dispatch({ type:"SET_NOTES", payload:cp })
            }}
            handleDeleteNote={async(nid)=>{
              const cp = {...state.notes}
              delete cp[nid]
              dispatch({ type:"SET_NOTES", payload:cp })
            }}
            userId="guest"
            totalQuestions={filteredQuestions.length}
            currentQuestionIndex={singleIndex}
            handleQuestionChange={()=>{}}
          />

          <div className="flex justify-between mt-4">
            <Button
              onClick={()=> setSingleIndex(Math.max(0, singleIndex-1))}
              disabled={singleIndex===0}
            >
              <ChevronLeft className="mr-2 h-4 w-4"/>
              Prev
            </Button>
            <Button
              onClick={()=> setSingleIndex(Math.min(filteredQuestions.length-1, singleIndex+1))}
              disabled={singleIndex===filteredQuestions.length-1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST
  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          {/* Switch to Single View */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={()=>dispatch({ type:"SET_VIEW_MODE", payload:ViewMode.SINGLE })}>
              Switch to Single View
            </Button>
          </div>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Guest Question Bank</h1>

          {/* Search + mobile filter + question navigator */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e)=> dispatch({ type:"SET_SEARCH_QUERY", payload:e.target.value })}
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300"/>
            </div>

            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="sm:hidden dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 flex items-center">
                  <Filter className="mr-2 h-4 w-4"/>
                  Filters
                </Button>
              </DialogTrigger>

              {/* Full-screen approach on small screens, centered on bigger screens */}
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[600px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  flex flex-col
                "
                style={{ padding: 0, margin: 0 }}
              >
                {/* Top bar with close & submit */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                  {/* Close button */}
                  <button
                    onClick={() => setFiltersOpenMobile(false)}
                    className="text-sm text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <h2 className="text-base font-semibold tracking-tight">
                    Filters
                  </h2>

                  <button
                    onClick={() => {
                      // apply filters, e.g. refetch
                      // or just close
                      setFiltersOpenMobile(false)
                    }}
                    className="
                      text-sm px-3 py-1 
                      rounded 
                      bg-blue-600 hover:bg-blue-700 text-white
                    "
                  >
                    Submit
                  </button>
                </div>

                {/* Scrollable filters */}
                <ScrollArea className="flex-grow px-4 py-2">
                  <MobileFilterPanel state={state} dispatch={dispatch}/>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Question navigator (desktop) */}
            <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden sm:flex dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100">
                  <List className="mr-2 h-4 w-4"/>
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100">
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((q, idx) => {
                      const qid = q.questionId ?? ""
                      const isCorrect = state.feedback[qid]==="correct"
                      return (
                        <Button
                          key={qid}
                          variant={isCorrect ? "default":"outline"}
                          size="sm"
                          onClick={()=>{
                            setNavigatorOpen(false)
                            const el = document.getElementById(`question-${qid}`)
                            if(el){
                              setTimeout(()=> el.scrollIntoView({ behavior:"smooth", block:"start" }),200)
                            }
                          }}
                          className={`w-10 h-10 dark:border-gray-700 ${
                            isCorrect
                              ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                              : state.reviewed[qid]
                              ? "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : ""
                          }`}
                        >
                          {idx+1}
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
            {["all","complete","review","incomplete"].map(st => (
              <button
                key={st}
                onClick={()=> dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, status:st } })}
                className={`px-4 py-2 rounded-md transition-colors
                  ${
                    state.filters.status===st
                      ? "bg-white dark:bg-gray-700 border dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 text-gray-500 dark:text-gray-100"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-gray-700 dark:hover:border-gray-500 text-gray-500 dark:text-gray-100"
                  }`}
              >
                {st.charAt(0).toUpperCase()+st.slice(1)}
              </button>
            ))}
          </div>

          {/* Desktop filter popovers */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(["exams","subjects","topics","subtopics","difficulties","years","types"] as (keyof FilterOptionsType)[]).map((filterKey) => {
              const distinctVals = state.filterOptions[filterKey] || []
              return (
                <Popover
                  key={filterKey}
                  content={
                    <div className="w-full bg-white dark:bg-gray-800 rounded-md p-2 sm:w-80">
                      <Input
                        type="text"
                        placeholder={`Search ${filterKey}...`}
                        className="mb-2 dark:text-gray-100 dark:bg-gray-700 dark:placeholder-gray-400"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {distinctVals.map(val => (
                          <div key={val} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={state.filters[filterKey].includes(val)}
                              onChange={()=>{
                                const arr = state.filters[filterKey]
                                const isSelected = arr.includes(val)
                                let newArr
                                if (isSelected) {
                                  newArr = arr.filter(x=> x!==val)
                                } else {
                                  newArr = [...arr,val]
                                }
                                dispatch({
                                  type:"SET_FILTERS",
                                  payload:{ ...state.filters, [filterKey]:newArr }
                                })
                              }}
                            />
                            <label className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-700">
                              {val}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  align="start"
                  openPopover={state.dropdowns[filterKey]}
                  setOpenPopover={(open)=> dispatch({ type:"SET_DROPDOWNS", payload:{ key: filterKey, value:!!open } })}
                >
                  <button
                    onClick={()=>{
                      const was = state.dropdowns[filterKey]
                      dispatch({ type:"SET_DROPDOWNS", payload:{ key: filterKey, value:!was } })
                    }}
                    className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 transition-all duration-75 hover:border-gray-800 dark:hover:border-gray-500 focus:outline-none active:bg-gray-100 dark:active:bg-gray-700"
                  >
                    <p className="text-gray-600 dark:text-gray-300">
                      {state.filters[filterKey].length
                        ? `${state.filters[filterKey].length} selected`
                        : filterKey.charAt(0).toUpperCase()+filterKey.slice(1)
                      }
                    </p>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all"/>
                  </button>
                </Popover>
              )
            })}
          </div>

          {/* The question progress card (like QBC) */}
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
                {/* overall progress => (answered / totalCount)*100 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                    {localStats.total>0 ? Math.round(localStats.progress) : 0}%
                  </span>
                </div>
                <Progress
                  value={localStats.progress}
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-700"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* total questions */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                        {localStats.total}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Total Questions
                      </p>
                    </div>
                  </div>
                  {/* answered */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-green-400 p-2 rounded-full bg-green-400/10">
                      <CheckCircle2 className="h-5 w-5"/>
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-green-600 dark:text-green-300">
                        {localStats.answered}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        Answered
                      </p>
                    </div>
                  </div>
                  {/* flagged */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                      <Flag className="h-5 w-5"/>
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-yellow-600 dark:text-yellow-300">
                        {localStats.forReview}
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

          {/* The question list */}
          {filteredQuestions.length>0 ? (
            <>
              {filteredQuestions.map((question, i) => {
                const qid = question.questionId ?? ""
                return (
                  <Question
                    key={qid}
                    question={question}
                    feedback={state.feedback[qid] || ""}
                    selectedOption={state.selectedOptions[qid] || ""}
                    numericalAnswer=""
                    handleOptionClick={(qId, option, correct) => {
                      const isCorrect = (option===correct)
                      dispatch({ 
                        type:"SET_FEEDBACK",
                        payload:{ ...state.feedback, [qId]: isCorrect?"correct":"incorrect" }
                      })
                      dispatch({
                        type:"SET_SELECTED_OPTIONS",
                        payload:{ ...state.selectedOptions, [qId]: option }
                      })
                    }}
                    handleNumericalSubmit={(qId, userAns, correctAns)=>{
                      const isCorrect = (userAns===correctAns)
                      dispatch({
                        type:"SET_FEEDBACK",
                        payload:{ ...state.feedback, [qId]: isCorrect?"correct":"incorrect" }
                      })
                    }}
                    handleNumericalChange={()=>{}}
                    handleMarkForReview={(qId)=>{
                      const copy = { ...state.reviewed }
                      copy[qId] = !copy[qId]
                      dispatch({ type:"SET_REVIEWED", payload:copy })
                    }}
                    handleMarkComplete={(qId)=>{
                      const copy = { ...state.completed }
                      copy[qId] = !copy[qId]
                      dispatch({ type:"SET_COMPLETED", payload:copy })
                    }}
                    isMarkedForReview={!!state.reviewed[qid]}
                    isMarkedComplete={!!state.completed[qid]}
                    showMarkscheme={!!state.showMarkscheme[qid]}
                    handleMarkschemeToggle={(qId)=>{
                      const cp = { ...state.showMarkscheme }
                      cp[qId] = !cp[qId]
                      dispatch({ type:"SET_SHOW_MARKSCHEME", payload:cp })
                    }}
                    markschemesDisabled={false}
                    handleResetQuestion={(qId)=>{
                      const newFb = { ...state.feedback }
                      delete newFb[qId]
                      const newSel = { ...state.selectedOptions }
                      delete newSel[qId]
                      const newRev = { ...state.reviewed, [qId]:false }
                      const newComp = { ...state.completed, [qId]:false }
                      dispatch({ type:"SET_FEEDBACK", payload:newFb })
                      dispatch({ type:"SET_SELECTED_OPTIONS", payload:newSel })
                      dispatch({ type:"SET_REVIEWED", payload:newRev })
                      dispatch({ type:"SET_COMPLETED", payload:newComp })
                    }}
                    note={state.notes[qid] || ""}
                    handleNoteChange={(nid,val)=>{
                      const cp = { ...state.notes, [nid]: val }
                      dispatch({ type:"SET_NOTES", payload:cp })
                    }}
                    handleDeleteNote={async(nid)=>{
                      const cp = { ...state.notes }
                      delete cp[nid]
                      dispatch({ type:"SET_NOTES", payload:cp })
                    }}
                    userId="guest"
                    totalQuestions={filteredQuestions.length}
                    currentQuestionIndex={i}
                    handleQuestionChange={()=>{}}
                  />
                )
              })}

              {/* Pagination UI */}
              {totalPages>1 && (
                <div className="mt-6 flex justify-center space-x-4 items-center">
                  <Button
                    variant="outline"
                    onClick={()=> dispatch({ type:"SET_CURRENT_PAGE", payload: Math.max(1, state.currentPage-1) })}
                    disabled={state.currentPage===1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4"/>
                    Prev Page
                  </Button>
                  <p className="text-sm">
                    Page {state.currentPage} of {totalPages}
                  </p>
                  <Button
                    variant="outline"
                    onClick={()=> dispatch({ type:"SET_CURRENT_PAGE", payload: Math.min(totalPages, state.currentPage+1) })}
                    disabled={state.currentPage===totalPages}
                  >
                    Next Page
                    <ChevronRight className="ml-2 h-4 w-4"/>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-400 dark:text-red-300">No questions found for these filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// -----------------------------------
// 5) The Mobile Filter Panel content
// -----------------------------------
function MobileFilterPanel({
  state,
  dispatch,
}: {
  state: StateType
  dispatch: React.Dispatch<ActionType>
}) {
  const statuses = ["all","complete","review","incomplete"]
  const filterKeys = ["exams","subjects","topics","subtopics","difficulties","years","types"] as (keyof FilterOptionsType)[]

  function handleStatusChange(st: string) {
    dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, status: st } })
  }

  function toggleFilterValue(fk: keyof FilterOptionsType, val: string) {
    const arr = state.filters[fk]
    const isIn = arr.includes(val)
    let newArr
    if (isIn) {
      newArr = arr.filter(x=> x!==val)
    } else {
      newArr = [...arr,val]
    }
    dispatch({ type:"SET_FILTERS", payload:{ ...state.filters, [fk]: newArr } })
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-semibold mb-2">Question Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <Button
              key={st}
              variant={state.filters.status===st ? "default":"outline"}
              size="sm"
              onClick={()=> handleStatusChange(st)}
            >
              {st.charAt(0).toUpperCase()+st.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filterKeys.map((fk) => {
        const distinctVals = state.filterOptions[fk] || []
        return (
          <div key={fk}>
            <p className="font-semibold mb-2">
              {fk.charAt(0).toUpperCase()+fk.slice(1)}
            </p>
            <div className="border p-2 rounded-md max-h-40 overflow-y-auto">
              {distinctVals.map((val) => (
                <label
                  key={val}
                  className="flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <input
                    type="checkbox"
                    className="form-checkbox w-4 h-4 text-blue-600 dark:text-blue-400"
                    checked={state.filters[fk].includes(val)}
                    onChange={()=> toggleFilterValue(fk,val)}
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

"use client"

import React, {
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useState,
} from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
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
import { useToast } from "@/components/ui/use-toast"

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

// The fields from the server
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
  reviewed?: boolean
  completed?: boolean
  // etc. if needed
}

// For distinct filter values
interface FilterOptions {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
}

// The user’s chosen filters
interface FiltersState {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: string[]
  types: string[]
  status: string  // "all" | "complete" | "review" | "incomplete"
}

// The shape of our local store
interface StateType {
  loading: boolean
  viewMode: ViewMode

  // The slice of questions from the server for page=..., pageSize=...
  questions: QuestionType[]
  totalCount: number
  currentPage: number
  pageSize: number

  // Distinct filter sets from /api/filters
  filterOptions: FilterOptions

  // The user’s actual selected filters
  filters: FiltersState

  // For drop-down popovers
  dropdowns: {
    exams: boolean
    subjects: boolean
    topics: boolean
    subtopics: boolean
    difficulties: boolean
    years: boolean
    types: boolean
  }

  // local search
  searchQuery: string

  // local guest progress
  feedback: Record<string, string>         // QID => "correct"/"incorrect"
  selectedOptions: Record<string, string> // QID => chosen MCQ letter
  reviewed: Record<string, boolean>       // QID => flagged for review
  completed: Record<string, boolean>      // QID => marked complete
  notes: Record<string, string>           // QID => note text
  showMarkscheme: Record<string, boolean> // QID => whether markscheme is shown
}

type ActionType =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_TOTAL_COUNT"; payload: number }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptions }
  | { type: "SET_FILTERS"; payload: FiltersState }
  | {
      type: "SET_DROPDOWNS"
      payload: { key: keyof StateType["dropdowns"]; value: boolean }
    }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_REVIEWED"; payload: Record<string, boolean> }
  | { type: "SET_COMPLETED"; payload: Record<string, boolean> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }

// pagination size
const PAGE_SIZE = 10

// ------------------------------------------------------------
// 2) The initial state
// ------------------------------------------------------------
const initialState: StateType = {
  loading: true,
  viewMode: ViewMode.LIST,
  questions: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: PAGE_SIZE,
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
}

// ------------------------------------------------------------
// 3) Reducer
// ------------------------------------------------------------
function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload }
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
    default:
      return state
  }
}

// A small helper to do fuzzy text searching
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// ------------------------------------------------------------
// 4) The main component
// ------------------------------------------------------------
export default function GuestQuestionBank() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [singleIndex, setSingleIndex] = useState(0)
  const { toast } = useToast()
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false)

  // --------------------------------------------
  // (A) Fetch Distinct Filter Values from /api/filters
  // --------------------------------------------
  const fetchFilterOptions = useCallback(async () => {
    try {
      console.log("Fetching /api/filters for distinct field values.")
      const res = await fetch("/api/filters")
      if (!res.ok) throw new Error("Failed to fetch filter options.")
      const data = await res.json() as FilterOptions
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not load filter options. Using minimal.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // --------------------------------------------
  // (B) Fetch Paginated Questions from /api/questions
  // with the user’s selected filters
  // --------------------------------------------
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      // We'll build a query string for exam, subject, etc. plus page & pageSize
      const {
        exams,
        subjects,
        topics,
        subtopics,
        difficulties,
        years,
        types,
        status,
      } = state.filters

      const page = state.currentPage
      const pageSize = state.pageSize

      const params = new URLSearchParams()
      if (exams.length) params.set("exam", exams[0])       // or pass multiple if your API supports
      if (subjects.length) params.set("subject", subjects[0])
      if (topics.length) params.set("topic", topics[0])
      if (subtopics.length) params.set("subtopic", subtopics[0])
      if (difficulties.length) params.set("difficulty", difficulties[0])
      if (years.length) params.set("year", years[0])
      if (types.length) params.set("type", types[0])
      // status is local, not necessarily in server route, but you can do so if you want
      // finally pagination
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      const url = `/api/questions?${params.toString()}`

      console.log("Fetching questions with =>", url)
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to fetch questions with filters/pagination.")
      }
      const result = await res.json()

      let questions: QuestionType[] = []
      let totalCount = 0
      if (Array.isArray(result)) {
        questions = result
        totalCount = result.length
      } else if (result.data) {
        questions = result.data
        totalCount = result.totalCount
      }

      // We assume the server does { orderBy: { questionId: 'asc' } }
      // so they're already ascending. If needed, you can sort here as well:
      questions = questions.map((q, i) => ({ ...q, id: i + 1 }))

      dispatch({ type: "SET_QUESTIONS", payload: questions })
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not load questions from server.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.filters, state.currentPage, state.pageSize, toast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // --------------------------------------------
  // (C) Load local guest progress from localStorage on mount
  // --------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("guestQuestionBank")
    if (saved) {
      const data = JSON.parse(saved)
      dispatch({ type: "SET_FEEDBACK", payload: data.feedback || {} })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: data.selectedOptions || {} })
      dispatch({ type: "SET_REVIEWED", payload: data.reviewed || {} })
      dispatch({ type: "SET_COMPLETED", payload: data.completed || {} })
      dispatch({ type: "SET_NOTES", payload: data.notes || {} })
      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: data.showMarkscheme || {} })
    }
  }, [])

  // (D) Save local progress whenever these slices change
  useEffect(() => {
    const toStore = {
      feedback: state.feedback,
      selectedOptions: state.selectedOptions,
      reviewed: state.reviewed,
      completed: state.completed,
      notes: state.notes,
      showMarkscheme: state.showMarkscheme,
    }
    localStorage.setItem("guestQuestionBank", JSON.stringify(toStore))
  }, [
    state.feedback,
    state.selectedOptions,
    state.reviewed,
    state.completed,
    state.notes,
    state.showMarkscheme,
  ])

  // --------------------------------------------
  // (E) Local Searching + Filtering
  // Here we filter the returned slice from the server.
  // If your server does full filtering, you can skip this local step.
  // --------------------------------------------
  const filteredQuestions = useMemo(() => {
    const search = state.searchQuery.toLowerCase()
    return state.questions.filter((q) => {
      // local text search
      const textFields = [q.text, q.exam, q.subject, q.topic, q.subtopic, q.type]
      const matchesSearch = textFields.some((f) => f && fuzzyContains(f, search))

      // local "status" filter
      let matchesStatus = true
      const qid = q.questionId || ""
      if (state.filters.status === "complete") {
        // show only those "completed"
        if (!state.completed[qid]) matchesStatus = false
      } else if (state.filters.status === "review") {
        if (!state.reviewed[qid]) matchesStatus = false
      } else if (state.filters.status === "incomplete") {
        if (state.completed[qid]) matchesStatus = false
      }
      return matchesSearch && matchesStatus
    })
  }, [state.questions, state.searchQuery, state.filters.status, state.completed, state.reviewed])

  // We can do single or list. If "single," we track singleIndex.
  // If "list," we show them all (or do local pagination).
  // We'll do a local approach here.

  // handle page change
  const handlePageChange = useCallback((newPage: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
  }, [])

  // feedback logic
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
  }, [state.feedback, state.selectedOptions])

  const handleNumericalSubmit = useCallback((questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer
    dispatch({
      type: "SET_FEEDBACK",
      payload: {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      },
    })
  }, [state.feedback])

  const handleNumericalChange = useCallback((questionId: string, val: string) => {
    console.log("numericalChange:", questionId, val)
  }, [])

  const handleMarkForReview = useCallback((questionId: string) => {
    const newReviewed = { ...state.reviewed }
    newReviewed[questionId] = !newReviewed[questionId]
    dispatch({ type: "SET_REVIEWED", payload: newReviewed })
  }, [state.reviewed])

  const handleMarkComplete = useCallback((questionId: string) => {
    const newCompleted = { ...state.completed }
    newCompleted[questionId] = !newCompleted[questionId]
    dispatch({ type: "SET_COMPLETED", payload: newCompleted })
  }, [state.completed])

  const handleMarkschemeToggle = useCallback((questionId: string) => {
    const newShow = { ...state.showMarkscheme }
    newShow[questionId] = !newShow[questionId]
    dispatch({ type: "SET_SHOW_MARKSCHEME", payload: newShow })
  }, [state.showMarkscheme])

  const handleResetQuestion = useCallback((questionId: string) => {
    const newFdbk = { ...state.feedback }
    delete newFdbk[questionId]
    const newSel = { ...state.selectedOptions }
    delete newSel[questionId]
    const newRev = { ...state.reviewed, [questionId]: false }
    const newCmpl = { ...state.completed, [questionId]: false }

    dispatch({ type: "SET_FEEDBACK", payload: newFdbk })
    dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSel })
    dispatch({ type: "SET_REVIEWED", payload: newRev })
    dispatch({ type: "SET_COMPLETED", payload: newCmpl })
  }, [state.feedback, state.selectedOptions, state.reviewed, state.completed])

  // stats
  const questionStats = useMemo(() => {
    let answered = 0
    let markedReview = 0
    filteredQuestions.forEach((q) => {
      const qid = q.questionId ?? ""
      if (state.reviewed[qid]) markedReview++
      if (state.feedback[qid] === "correct") answered++
    })
    return {
      total: filteredQuestions.length,
      answered,
      markedReview,
    }
  }, [filteredQuestions, state.feedback, state.reviewed])

  // single vs list
  // If single
  if (state.viewMode === ViewMode.SINGLE) {
    if (filteredQuestions.length === 0) {
      return (
        <div className="p-4 min-h-screen">
          <Button onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}>
            Switch to List View
          </Button>
          <p className="mt-4 text-red-400">No questions found for these filters.</p>
        </div>
      )
    }
    const currentQ = filteredQuestions[singleIndex]
    return (
      <div className="p-4 min-h-screen">
        <div className="flex justify-end mb-4">
          <Button onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.LIST })}>
            Switch to List View
          </Button>
        </div>
        <p className="mb-2">{singleIndex+1} / {filteredQuestions.length}</p>
        <Question
          question={currentQ}
          feedback={state.feedback[currentQ.questionId ?? ""] || ""}
          selectedOption={state.selectedOptions[currentQ.questionId ?? ""] || ""}
          numericalAnswer=""
          handleOptionClick={handleOptionClick}
          handleNumericalSubmit={handleNumericalSubmit}
          handleNumericalChange={handleNumericalChange}
          handleMarkForReview={() => handleMarkForReview(currentQ.questionId ?? "")}
          handleMarkComplete={() => handleMarkComplete(currentQ.questionId ?? "")}
          isMarkedForReview={!!state.reviewed[currentQ.questionId ?? ""]}
          isMarkedComplete={!!state.completed[currentQ.questionId ?? ""]}
          showMarkscheme={!!state.showMarkscheme[currentQ.questionId ?? ""]}
          handleMarkschemeToggle={() => handleMarkschemeToggle(currentQ.questionId ?? "")}
          markschemesDisabled={false}
          handleResetQuestion={handleResetQuestion}
          note={state.notes[currentQ.questionId ?? ""] || ""}
          handleNoteChange={(qid, val) => {
            const newNotes = { ...state.notes, [qid]: val }
            dispatch({ type: "SET_NOTES", payload: newNotes })
          }}
          handleDeleteNote={async (qid) => {
            const newNotes = { ...state.notes }
            delete newNotes[qid]
            dispatch({ type: "SET_NOTES", payload: newNotes })
          }}
          userId="guest"
          totalQuestions={filteredQuestions.length}
          currentQuestionIndex={singleIndex}
          handleQuestionChange={() => {}}
        />
        <div className="flex justify-between mt-4">
          <Button onClick={() => setSingleIndex(Math.max(0, singleIndex-1))} disabled={singleIndex===0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Prev
          </Button>
          <Button onClick={() => setSingleIndex(Math.min(filteredQuestions.length-1, singleIndex+1))} disabled={singleIndex===filteredQuestions.length-1}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // If list
  if (state.loading) {
    return (
      <div className="p-4 min-h-screen">
        <Skeleton count={5} />
      </div>
    )
  }

  // We are in LIST mode
  // Display the entire "page" from the server. Then apply local search => filteredQuestions
  // Possibly do local pagination of filteredQuestions if you want. For simplicity, let's show them all.
  // We'll do a local approach of a "list" with no further slicing. If you want local pagination, re-add it.

  return (
    <TooltipProvider>
      <div className="p-4 min-h-screen w-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-end mb-4">
            <Button onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.SINGLE })}>
              Switch to Single View
            </Button>
          </div>

          <h1 className="text-2xl mb-2">Guest Question Bank with Full Filters</h1>

          {/* status filter row */}
          <div className="flex space-x-4 mb-4">
            {["all", "complete", "review", "incomplete"].map((status) => (
              <Button
                key={status}
                variant={state.filters.status === status ? "default" : "outline"}
                onClick={() => {
                  dispatch({
                    type: "SET_FILTERS",
                    payload: { ...state.filters, status },
                  })
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* The row of popovers for exam, subject, topic, subtopic, difficulty, year, type */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              "exams",
              "subjects",
              "topics",
              "subtopics",
              "difficulties",
              "years",
              "types",
            ] as (keyof FilterOptions)[]).map((filterKey) => {
              const distinctValues = state.filterOptions[filterKey]
              return (
                <Popover
                  key={filterKey}
                  content={
                    <div className="w-full bg-white border rounded-md p-2 sm:w-80">
                      <Input placeholder={`Search ${filterKey}...`} className="mb-2" />
                      <div className="max-h-60 overflow-y-auto">
                        {distinctValues.map((val) => (
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
                                  newArr = arr.filter((x) => x!== val)
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
                    onClick={() => {
                      const isOpen = state.dropdowns[filterKey]
                      dispatch({
                        type: "SET_DROPDOWNS",
                        payload: { key: filterKey, value: !isOpen },
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

          {/* SEARCH bar */}
          <div className="relative flex mb-6">
            <Input
              placeholder="Search questions..."
              value={state.searchQuery}
              onChange={(e) =>
                dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
              }
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900">Guest Access</h3>
              <p className="text-sm text-blue-700">
                This is a guest. Filter + progress is stored in local storage only.
              </p>
            </CardContent>
          </Card>

          {state.loading ? (
            <Skeleton count={5} height={40} />
          ) : (
            <>
              {filteredQuestions.length > 0 ? (
                <>
                  {filteredQuestions.map((question, idx) => {
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
                            payload: {
                              ...state.feedback,
                              [qId]: isCorrect ? "correct" : "incorrect",
                            },
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
                            payload: {
                              ...state.feedback,
                              [qId]: isCorrect ? "correct" : "incorrect",
                            },
                          })
                        }}
                        handleNumericalChange={() => {}}
                        handleMarkForReview={(qId) => {
                          const newRev = { ...state.reviewed }
                          newRev[qId] = !newRev[qId]
                          dispatch({ type: "SET_REVIEWED", payload: newRev })
                        }}
                        handleMarkComplete={(qId) => {
                          const newC = { ...state.completed }
                          newC[qId] = !newC[qId]
                          dispatch({ type: "SET_COMPLETED", payload: newC })
                        }}
                        isMarkedForReview={!!state.reviewed[qid]}
                        isMarkedComplete={!!state.completed[qid]}
                        showMarkscheme={!!state.showMarkscheme[qid]}
                        handleMarkschemeToggle={(qId) => {
                          const newShow = { ...state.showMarkscheme }
                          newShow[qId] = !newShow[qId]
                          dispatch({ type: "SET_SHOW_MARKSCHEME", payload: newShow })
                        }}
                        markschemesDisabled={false}
                        handleResetQuestion={(qId) => {
                          // remove feedback + selected
                          const fdbkCopy = { ...state.feedback }
                          delete fdbkCopy[qId]
                          const selCopy = { ...state.selectedOptions }
                          delete selCopy[qId]
                          const revCopy = { ...state.reviewed, [qId]: false }
                          const compCopy = { ...state.completed, [qId]: false }
                          dispatch({ type: "SET_FEEDBACK", payload: fdbkCopy })
                          dispatch({ type: "SET_SELECTED_OPTIONS", payload: selCopy })
                          dispatch({ type: "SET_REVIEWED", payload: revCopy })
                          dispatch({ type: "SET_COMPLETED", payload: compCopy })
                        }}

                        note={state.notes[qid] || ""}
                        handleNoteChange={(nid, val) => {
                          const newN = { ...state.notes, [nid]: val }
                          dispatch({ type: "SET_NOTES", payload: newN })
                        }}
                        handleDeleteNote={async (nid) => {
                          const newN = { ...state.notes }
                          delete newN[nid]
                          dispatch({ type: "SET_NOTES", payload: newN })
                        }}

                        userId="guest"
                        totalQuestions={filteredQuestions.length}
                        currentQuestionIndex={idx}
                        handleQuestionChange={() => {}}
                      />
                    )
                  })}

                  {/* Show a simple server pagination bar (for ascending order from question #1) */}
                  <div className="mt-6 flex justify-center items-center space-x-4">
                    <Button
                      variant="outline"
                      disabled={state.currentPage <= 1}
                      onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage-1 })}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Prev Page
                    </Button>
                    <p className="text-sm">
                      Page {state.currentPage} of {Math.ceil(state.totalCount / state.pageSize)}
                    </p>
                    <Button
                      variant="outline"
                      disabled={state.currentPage >= Math.ceil(state.totalCount / state.pageSize)}
                      onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage+1 })}
                    >
                      Next Page
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-red-400">No questions found with these filters.</p>
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

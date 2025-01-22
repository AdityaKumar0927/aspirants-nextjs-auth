"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import Question from "@/components/shared/Question" // adjust import if needed
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
  reviewed?: boolean
  completed?: boolean
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  lastAttempted?: string
  diagramUrl?: string
  status?: QuestionStatus
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

interface UserAnswer {
  questionId: string
  selectedOption: string
  isCorrect: boolean
}

interface UserPerformance {
  questionId: string
  correctAnswers: number
  incorrectAnswers: number
  uniqueQuestions: number
  questionsAttempted: number
  timeSpent: number
  accuracy: number
  weaknessBySubtopic: any
  improvementOverTime: any
  attemptRate: number
  firstAttemptSuccessRate: number
  reattemptAccuracy: number
  topicPerformance: any
  consistency: number
  engagementLevel: number
  completed: boolean
  reviewed: boolean
}

type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: string
}

type StateType = {
  questions: QuestionType[]
  filters: FiltersType
  searchQuery: string
  dropdowns: {
    exam: boolean
    subject: boolean
    topic: boolean
    subtopic: boolean
    difficulty: boolean
    year: boolean
    type: boolean
  }
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
  | { type: "SET_DROPDOWN"; payload: { tag: keyof FiltersType; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_PAGE"; payload: number }

//
// --------------- Reducer & Initial State ---------------
//

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
  dropdowns: {
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
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
        dropdowns: { ...state.dropdowns, [action.payload.tag]: action.payload.value },
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

//
// --------------- UI Components ---------------
//

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

//
// --------------- Main Component ---------------
//

export default function QuestionBankContent() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)

  //
  // 1. typed fetchData that returns an array of T
  //
  const fetchData = useCallback(async <T,>(url: string): Promise<T[]> => {
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch ${url}: ${errorText}`)
    }
    const data = await response.json()
    // If the server returns { data: [...] } or an array directly:
    if (Array.isArray(data)) {
      return data as T[]
    }
    if (data && Array.isArray(data.data)) {
      return data.data as T[]
    }
    // If error:
    if (data && data.error) {
      throw new Error(data.error)
    }
    throw new Error(`Unexpected response from ${url}, expected array but got: ${JSON.stringify(data)}`)
  }, [])

  //
  // 2. Combine multiple calls
  //
  const fetchAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const [questionsData, userProgressData, userAnswersData, userPerformanceData] =
        await Promise.all([
          fetchData<QuestionType>("/api/questions"),
          fetchData<any>("/api/user-progress"),
          fetchData<UserAnswer>("/api/user-answers"),
          fetchData<UserPerformance>("/api/user-performance/get"),
        ])

      const feedback: Record<string, string> = {}
      const selectedOptions: Record<string, string> = {}
      const notes: Record<string, string> = {}

      // typed map: (q: QuestionType, index: number)
      const mergedQuestions: QuestionType[] = questionsData.map(
        (q: QuestionType, index: number) => {
          const forcedId = index + 1
          const progress = userProgressData.find((p: any) => p.questionId === q.questionId)
          const userAnswer = userAnswersData.find((a) => a.questionId === q.questionId)
          const performance = userPerformanceData.find((p) => p.questionId === q.questionId)

          if (userAnswer) {
            selectedOptions[q.questionId] = userAnswer.selectedOption
            feedback[q.questionId] = userAnswer.isCorrect ? "correct" : "incorrect"
          }

          return {
            ...q,
            id: forcedId,
            reviewed: performance?.reviewed ?? progress?.reviewed ?? false,
            completed: performance?.completed ?? progress?.completed ?? false,
            lastAttempted: progress?.lastAttempted ?? "",
          }
        }
      )

      mergedQuestions.sort((a, b) => a.id - b.id)

      dispatch({ type: "SET_QUESTIONS", payload: mergedQuestions })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: selectedOptions })
      dispatch({ type: "SET_FEEDBACK", payload: feedback })
      dispatch({ type: "SET_NOTES", payload: notes })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [toast, fetchData])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData()
    }
  }, [fetchAllData, status])

  //
  // 3. computed data (filters/pagination)
  //
  const filteredQuestions = useMemo(() => {
    const searchQuery = state.searchQuery.toLowerCase()
    return state.questions.filter((question) => {
      const matchesSearch =
        question.text.toLowerCase().includes(searchQuery) ||
        (question.topic && question.topic.toLowerCase().includes(searchQuery)) ||
        (question.subtopic && question.subtopic.toLowerCase().includes(searchQuery)) ||
        (question.subject && question.subject.toLowerCase().includes(searchQuery))

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
          (question.difficulty &&
            state.filters.difficulties.includes(question.difficulty))) &&
        (!state.filters.years.length ||
          (question.year && state.filters.years.includes(question.year.toString()))) &&
        (!state.filters.types.length ||
          (question.type && state.filters.types.includes(question.type)))

      if (state.filters.status === "review") {
        return matchesSearch && matchesFilters && question.reviewed
      } else if (state.filters.status === "complete") {
        return matchesSearch && matchesFilters && question.completed
      }
      return matchesSearch && matchesFilters
    })
  }, [state.questions, state.filters, state.searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
  const paginatedQuestions = useMemo(() => {
    const startIndex = (state.currentPage - 1) * PAGE_SIZE
    return filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredQuestions, state.currentPage])

  //
  // 4. Filter changes, pagination, etc.
  //
  const handlePageChange = useCallback((page: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page })
  }, [])

  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      const filterValues = state.filters[tag]
      if (Array.isArray(filterValues)) {
        const isSelected = filterValues.includes(value)
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value]

        const newFilters = { ...state.filters, [tag]: updatedFilter }

        if (tag === "exams") {
          const selectedExams = newFilters.exams
          newFilters.subjects = newFilters.subjects.filter((subj) =>
            state.questions.some(
              (q) => q.exam && selectedExams.includes(q.exam) && q.subject === subj
            )
          )
          newFilters.topics = newFilters.topics.filter((topic) =>
            state.questions.some(
              (q) => q.exam && selectedExams.includes(q.exam) && q.topic === topic
            )
          )
          newFilters.subtopics = newFilters.subtopics.filter((subt) =>
            state.questions.some(
              (q) => q.exam && selectedExams.includes(q.exam) && q.subtopic === subt
            )
          )
          newFilters.types = newFilters.types.filter((t) =>
            state.questions.some((q) => q.exam && selectedExams.includes(q.exam) && q.type === t)
          )
        }

        dispatch({ type: "SET_FILTERS", payload: newFilters })
      }
    },
    [state.filters, state.questions]
  )

  //
  // 5. Updating user performance / user answers
  //
  const updateUserPerformance = useCallback(
    async (
      questionId: string,
      updatedFields: Partial<QuestionType & Omit<UserPerformance, "timePerQuestion">>
    ) => {
      try {
        const response = await fetch("/api/user-performance/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, ...updatedFields }),
        })
        if (!response.ok) throw new Error("Failed to update user performance")
        return await response.json()
      } catch (error) {
        console.error("Error updating user performance:", error)
      }
    },
    []
  )

  const saveUserAnswer = useCallback(
    async (questionId: string, selectedOption: string, isCorrect: boolean) => {
      try {
        const response = await fetch("/api/user-answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedOption, isCorrect }),
        })
        if (!response.ok) throw new Error("Failed to save user answer")
        return await response.json()
      } catch (error) {
        console.error("Error saving user answer:", error)
      }
    },
    []
  )

  const handleMarkComplete = useCallback(
    (questionId: string) => {
      updateUserPerformance(questionId, { completed: true }).then((updatedPerformance) => {
        if (updatedPerformance) {
          dispatch({
            type: "SET_QUESTIONS",
            payload: state.questions.map((q) =>
              q.questionId === questionId ? { ...q, completed: true } : q
            ),
          })
        }
      })
    },
    [updateUserPerformance, state.questions]
  )

  const handleMarkForReview = useCallback(
    (questionId: string) => {
      updateUserPerformance(questionId, { reviewed: true }).then((updatedPerformance) => {
        if (updatedPerformance) {
          dispatch({
            type: "SET_QUESTIONS",
            payload: state.questions.map((q) =>
              q.questionId === questionId ? { ...q, reviewed: true } : q
            ),
          })
        }
      })
    },
    [updateUserPerformance, state.questions]
  )

  const handleOptionClick = useCallback(
    async (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption
      const newFeedback = {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      }
      const newSelectedOptions = { ...state.selectedOptions, [questionId]: option }

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelectedOptions })

      const updatedFields = {
        correctAnswers: isCorrect ? 1 : 0,
        incorrectAnswers: isCorrect ? 0 : 1,
        uniqueQuestions: 1,
        questionsAttempted: 1,
        lastAttempted: new Date().toISOString(),
        completed: true,
        accuracy: isCorrect ? 100 : 0,
        firstAttemptSuccessRate: isCorrect ? 100 : 0,
        reattemptAccuracy: isCorrect ? 100 : 0,
      }

      const [updatedPerformance] = await Promise.all([
        updateUserPerformance(questionId, updatedFields),
        saveUserAnswer(questionId, option, isCorrect),
      ])

      if (updatedPerformance) {
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: true } : q
          ),
        })
      }
    },
    [saveUserAnswer, updateUserPerformance, state.feedback, state.selectedOptions, state.questions]
  )

  const handleNumericalSubmit = useCallback(
    async (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer
      const newFeedback = {
        ...state.feedback,
        [questionId]: isCorrect ? "correct" : "incorrect",
      }

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })

      const updatedFields = {
        lastAttempted: new Date().toISOString(),
        completed: true,
        accuracy: isCorrect ? 100 : 0,
        firstAttemptSuccessRate: isCorrect ? 100 : 0,
        reattemptAccuracy: isCorrect ? 100 : 0,
      }

      const [updatedPerformance] = await Promise.all([
        updateUserPerformance(questionId, updatedFields),
        saveUserAnswer(questionId, userAnswer, isCorrect),
      ])

      if (updatedPerformance) {
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: true } : q
          ),
        })
      }
    },
    [saveUserAnswer, updateUserPerformance, state.feedback, state.questions]
  )

  const handleNumericalChange = useCallback(
    (questionId: string, value: string) => {
      const newNumbers = { ...state.numericalAnswers, [questionId]: value }
      dispatch({ type: "SET_NUMERICAL_ANSWERS", payload: newNumbers })
    },
    [state.numericalAnswers]
  )

  const handleNoteChange = useCallback(
    async (questionId: string, note: string) => {
      const newNotes = { ...state.notes, [questionId]: note }
      dispatch({ type: "SET_NOTES", payload: newNotes })

      // Example: save note to server
      try {
        const response = await fetch("/api/notes/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, content: note }),
        })
        if (!response.ok) throw new Error("Failed to save note")
      } catch (error) {
        console.error("Error saving note:", error)
      }
    },
    [state.notes]
  )

  const handleDeleteNote = useCallback(
    async (questionId: string) => {
      try {
        const response = await fetch("/api/notes/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        })
        if (!response.ok) throw new Error("Failed to delete note")

        const newNotes = { ...state.notes, [questionId]: "" }
        dispatch({ type: "SET_NOTES", payload: newNotes })
      } catch (error) {
        console.error("Error deleting note:", error)
      }
    },
    [state.notes]
  )

  const handleNavigatorClick = useCallback(
    (index: number) => {
      const newPage = Math.floor(index / PAGE_SIZE) + 1
      dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
      setIsNavigatorOpen(false)

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

  const questionStats = useMemo(() => {
    const stats = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
    }
    filteredQuestions.forEach((question) => {
      if (question.reviewed) {
        stats.markedForReview++
      } else if (question.completed) {
        stats.answered++
      } else if (question.lastAttempted) {
        stats.notAnswered++
      } else {
        stats.notVisited++
      }
    })
    return stats
  }, [filteredQuestions])

  //
  // 6. Render
  //
  if (status === "loading" || state.loading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left font-display text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
            Question Bank
          </h1>
          <div className="flex space-x-4 mb-6">
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map(
              (filterType) => (
                <div key={filterType} className="flex items-center space-x-2">
                  <Skeleton height={40} width={120} />
                </div>
              )
            )}
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

  if (status === "unauthenticated") {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left font-display text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
            Question Bank
          </h1>
          <GuestBanner />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left font-display text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
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
            <Dialog open={isNavigatorOpen} onOpenChange={setIsNavigatorOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100"
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

          <div className="flex space-x-4 mb-2">
            {["all", "complete", "review"].map((filterStatus) => (
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {["exams", "subjects", "topics", "subtopics", "difficulties", "years", "types"].map(
              (filterType) => (
                <Tooltip key={filterType}>
                  <TooltipTrigger asChild>
                    <Popover
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
                                  .filter(
                                    (q) =>
                                      !state.filters.exams.length ||
                                      (q.exam && state.filters.exams.includes(q.exam)) ||
                                      filterType === "exams"
                                  )
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
                                  id={`${filterType}-${value}`}
                                  className="mr-2"
                                  checked={(
                                    state.filters[filterType as keyof FiltersType] as string[]
                                  ).includes(value)}
                                  onChange={() =>
                                    handleFilterChange(filterType as keyof FiltersType, value)
                                  }
                                />
                                <label
                                  htmlFor={`${filterType}-${value}`}
                                  className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      }
                      align="start"
                      openPopover={state.dropdowns[filterType as keyof typeof state.dropdowns]}
                      setOpenPopover={(open) => {
                        dispatch({
                          type: "SET_DROPDOWN",
                          payload: { tag: filterType as keyof FiltersType, value: !!open },
                        })
                      }}
                    >
                      <button
                        onClick={() =>
                          dispatch({
                            type: "SET_DROPDOWN",
                            payload: {
                              tag: filterType as keyof FiltersType,
                              value: !state.dropdowns[filterType as keyof typeof state.dropdowns],
                            },
                          })
                        }
                        className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 transition-all duration-75 hover:border-gray-800 dark:hover:border-gray-500 focus:outline-none active:bg-gray-100 dark:active:bg-gray-700"
                      >
                        <p className="text-gray-600 dark:text-gray-300">
                          {Array.isArray(state.filters[filterType as keyof FiltersType]) &&
                          (state.filters[filterType as keyof FiltersType] as string[]).length
                            ? `${
                                (state.filters[filterType as keyof FiltersType] as string[]).length
                              } selected`
                            : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </p>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-600 dark:text-gray-300 transition-all ${
                            state.dropdowns[filterType as keyof typeof state.dropdowns]
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent className="dark:bg-gray-700 dark:text-gray-50">
                    Select {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>

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
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-700"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                        {questionStats.notVisited}
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-light tracking-tighter text-green-600 dark:text-green-300">
                        {questionStats.answered}
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
                        {questionStats.markedForReview}
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
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={(questionId, value) =>
                    dispatch({
                      type: "SET_NUMERICAL_ANSWERS",
                      payload: { ...state.numericalAnswers, [questionId]: value },
                    })
                  }
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
                  isMarkedForReview={question.reviewed || false}
                  isMarkedComplete={question.completed || false}
                  markschemesDisabled={false}
                  note={state.notes[question.questionId] || ""}
                  handleNoteChange={handleNoteChange}
                  handleDeleteNote={handleDeleteNote}
                  userId={session?.user?.id || ""}
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
              No questions found with the selected filters.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

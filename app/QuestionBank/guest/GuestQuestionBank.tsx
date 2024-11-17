"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useState, Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ChevronDown, ChevronLeft, ChevronRight, Search, List, Circle, CheckCircle2, HelpCircle, Flag } from 'lucide-react'
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import Question from "@/components/shared/Question"
import Popover from "@/components/shared/popover"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const PAGE_SIZE = 10

type QuestionType = {
  questionId: string
  text: string
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  type: "Multiple Choice" | "Numerical"
  year: string
  options?: string[]
  correctOption?: string
  exam: string
  reviewed: boolean
  completed: boolean
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

const StatusCard = ({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) => {
  return (
    <div className={`flex items-center p-4 rounded-lg bg-gray-900 transition-all duration-300`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <p className="text-sm font-medium text-gray-400">{label}</p>
      </div>
    </div>
  )
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
        <span className="sr-only">Next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export default function GuestQuestionBank() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const { toast } = useToast()

  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await fetch("/api/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const questions: QuestionType[] = await response.json()
      const sortedQuestions = questions.sort((a, b) => {
        const aMatch = a.questionId.match(/\d+/);
        const bMatch = b.questionId.match(/\d+/);
        const aNum = aMatch ? parseInt(aMatch[0], 10) : 0;
        const bNum = bMatch ? parseInt(bMatch[0], 10) : 0;
        return aNum - bNum;
      });
      dispatch({ type: "SET_QUESTIONS", payload: sortedQuestions })
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

  useEffect(() => {
    fetchQuestions()

    // Load progress from localStorage
    const savedProgress = localStorage.getItem('guestProgress')
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

  useEffect(() => {
    // Save progress to localStorage whenever it changes
    localStorage.setItem('guestProgress', JSON.stringify({
      feedback: state.feedback,
      selectedOptions: state.selectedOptions,
      notes: state.notes,
      reviewed: state.reviewed,
      completed: state.completed,
      showMarkscheme: state.showMarkscheme
    }))
  }, [state.feedback, state.selectedOptions, state.notes, state.reviewed, state.completed, state.showMarkscheme])

  const filteredQuestions = useMemo(() => {
    return state.questions.filter((question) => {
      const searchQuery = state.searchQuery.toLowerCase()
      const matchesSearch =
        question.text.toLowerCase().includes(searchQuery) ||
        question.topic.toLowerCase().includes(searchQuery) ||
        question.subtopic.toLowerCase().includes(searchQuery) ||
        question.subject.toLowerCase().includes(searchQuery)

      const matchesFilters =
        (!state.filters.exams.length || state.filters.exams.includes(question.exam)) &&
        (!state.filters.subjects.length || state.filters.subjects.includes(question.subject)) &&
        (!state.filters.topics.length || state.filters.topics.includes(question.topic)) &&
        (!state.filters.subtopics.length || state.filters.subtopics.includes(question.subtopic)) &&
        (!state.filters.difficulties.length || state.filters.difficulties.includes(question.difficulty)) &&
        (!state.filters.years.length || state.filters.years.includes(question.year)) &&
        (!state.filters.types.length || state.filters.types.includes(question.type))

      if (state.filters.status === "complete") {
        return matchesSearch && matchesFilters && state.feedback[question.questionId] === "correct"
      } else if (state.filters.status === "review") {
        return matchesSearch && matchesFilters && state.reviewed[question.questionId]
      }

      return matchesSearch && matchesFilters
    })
  }, [state.questions, state.filters, state.searchQuery, state.feedback, state.reviewed])

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)

  const paginatedQuestions = useMemo(() => {
    const startIndex = (state.currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredQuestions.slice(startIndex, endIndex)
  }, [filteredQuestions, state.currentPage])

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
        dispatch({ type: "SET_FILTERS", payload: newFilters })
      }
    },
    [state.filters]
  )

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

  const handleNoteChange = useCallback(
    (questionId: string, note: string) => {
      const newNotes = { ...state.notes, [questionId]: note }
      dispatch({ type: "SET_NOTES", payload: newNotes })
    },
    [state.notes]
  )

  const handleNavigatorClick = useCallback((index: number) => {
    const newPage = Math.floor(index / PAGE_SIZE) + 1
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
    setIsNavigatorOpen(false)
  }, [])

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

  const handleSetDropdown = useCallback((filterType: string) => {
    return (value: SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(state.dropdowns[filterType] || false) : value;
      dispatch({
        type: "SET_DROPDOWN",
        payload: { tag: filterType, value: newValue },
      });
    };
  }, [state.dropdowns]);

  const handleMarkschemeToggle = useCallback((questionId: string) => {
    const newShowMarkscheme = { ...state.showMarkscheme, [questionId]: !state.showMarkscheme[questionId] }
    dispatch({ type: "SET_SHOW_MARKSCHEME", payload: newShowMarkscheme })
  }, [state.showMarkscheme])

  const questionStats = useMemo(() => {
    const stats = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
    }

    filteredQuestions.forEach((question) => {
      if (state.reviewed[question.questionId]) {
        stats.markedForReview++
      } else if (state.feedback[question.questionId] === "correct") {
        stats.answered++
      } else if (state.selectedOptions[question.questionId]) {
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
              <Link href="/QuestionBank" className="hidden sm:block">
                <Button variant="outline" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                  Sign in
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
                    {filteredQuestions.map((question, index) => (
                      <Tooltip key={question.questionId}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={state.feedback[question.questionId] === "correct" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleNavigatorClick(index)}
                            className={`w-10 h-10 ${
                              state.feedback[question.questionId] === "correct"
                                ? "bg-green-100 border-green-500 text-green-700"
                                : ""
                            }`}
                          >
                            {index + 1}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
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
            {[
              "exams",
              "subjects",
              "topics",
              "subtopics",
              "difficulties",
              "years",
              "types",
            ].map((filterType) => (
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
                              state.questions.map((q) => {
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
                                    return q.year
                                  case "types":
                                    return q.type
                                  default:
                                    return ""
                                }
                              })
                            )
                          ).map((value: string) => (
                            <div key={value} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${filterType}-${value}`}
                                className="mr-2"
                                checked={
                                  (state.filters[filterType as keyof FiltersType] as string[] ||
                                    []
                                  ).includes(value)
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
                          ))}
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
                              (state.filters[filterType as keyof FiltersType] as string[])
                                .length
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
            ))}
          </div>

          <Card className="bg-black text-white border-gray-800 mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                Question Progress
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-400">Overall Progress</span>
                  <span className="text-sm font-medium text-white">
                    {Math.round((questionStats.answered / filteredQuestions.length) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(questionStats.answered / filteredQuestions.length) * 100} 
                  className="w-full h-1 bg-gray-700" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatusCard
                    icon={<HelpCircle className="h-5 w-5" />}
                    label="Not Visited"
                    value={questionStats.notVisited}
                    color="text-gray-400"
                  />
                  <StatusCard
                    icon={<Circle className="h-5 w-5" />}
                    label="Not Answered"
                    value={questionStats.notAnswered}
                    color="text-blue-400"
                  />
                  <StatusCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Answered"
                    value={questionStats.answered}
                    color="text-green-400"
                  />
                  <StatusCard
                    icon={<Flag className="h-5 w-5" />}
                    label="For Review"
                    value={questionStats.markedForReview}
                    color="text-yellow-400"
                  />
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
                  handleOptionClick={handleOptionClick}
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedForReview={state.reviewed[question.questionId]}
                  isMarkedComplete={state.completed[question.questionId]}
                  note={state.notes[question.questionId] || ""}
                  handleNoteChange={handleNoteChange}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={index + (state.currentPage - 1) * PAGE_SIZE}
                  handleQuestionChange={handleNavigatorClick}
                  numericalAnswer=""
                  showMarkscheme={state.showMarkscheme[question.questionId] || false}
                  handleNumericalSubmit={() => {}}
                  handleNumericalChange={() => {}}
                  handleMarkschemeToggle={() => handleMarkschemeToggle(question.questionId)}
                  markschemesDisabled={false}
                  userId=""
                  handleDeleteNote={async (questionId: string) => {
                    const newNotes = { ...state.notes }
                    delete newNotes[questionId]
                    dispatch({ type: "SET_NOTES", payload: newNotes })
                  }}
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
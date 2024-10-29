"use client"

import React, { useReducer, useEffect, useMemo, useCallback } from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import Question from "@/components/shared/Question"
import Popover from "@/components/shared/popover"
import { ChevronDown } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 10

interface QuestionType {
  exam: string
  questionId: string
  text: string
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  type: "Multiple Choice" | "Numerical"
  year: string
  reviewed: boolean
  completed: boolean
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  lastAttempted?: string
  diagramUrl?: string
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
  | { type: "UPDATE_QUESTION"; payload: { questionId: string; updates: Partial<QuestionType> } }

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
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.questionId === action.payload.questionId
            ? { ...q, ...action.payload.updates }
            : q
        ),
      }
    default:
      return state
  }
}

const QuestionBank: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const userId = "" // Add logic to retrieve user ID if signed in

  const fetchAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const [questionsData, userProgressData = [], userAnswersData = [], notesData = [], userPerformanceData = []] =
        await Promise.all([
          fetchData("/api/questions"),
          userId
            ? Promise.all([
                fetchData("/api/user-progress"),
                fetchData("/api/user-answers"),
                fetchData("/api/notes"),
                fetchData("/api/user-performance/get"),
              ])
            : [],
        ]).then((results) => (userId ? [results[0], ...results[1]] : [results[0]]))

      const feedback: Record<string, string> = {}
      const selectedOptions: Record<string, string> = {}
      const notes: Record<string, string> = {}

      const mergedQuestions = questionsData.map((question: QuestionType) => {
        const progress = userProgressData.find(
          (p: any) => p.questionId === question.questionId
        )
        const userAnswer = userAnswersData.find(
          (a: UserAnswer) => a.questionId === question.questionId
        )
        const note = notesData.find((n: any) => n.questionId === question.questionId)
        const performance = userPerformanceData.find(
          (p: UserPerformance) => p.questionId === question.questionId
        )

        if (userAnswer) {
          selectedOptions[question.questionId] = userAnswer.selectedOption
          feedback[question.questionId] = userAnswer.isCorrect ? "correct" : "incorrect"
        }

        if (note) {
          notes[question.questionId] = note.content
        }

        return {
          ...question,
          reviewed: performance?.reviewed ?? progress?.reviewed ?? false,
          completed: performance?.completed ?? progress?.completed ?? false,
          notes: note ? note.content : "",
          lastAttempted: progress?.lastAttempted ?? "",
          performance: performance || {},
        }
      })

      mergedQuestions.sort(
        (a: QuestionType, b: QuestionType) =>
          parseInt(a.questionId, 10) - parseInt(b.questionId, 10)
      )

      dispatch({ type: "SET_QUESTIONS", payload: mergedQuestions })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: selectedOptions })
      dispatch({ type: "SET_FEEDBACK", payload: feedback })
      dispatch({ type: "SET_NOTES", payload: notes })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [userId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const filteredQuestions = useMemo(() => {
    let filtered = state.questions.filter((question) => {
      const searchQuery = state.searchQuery.toLowerCase()
      const matchesSearch =
        question.text.toLowerCase().includes(searchQuery) ||
        question.topic.toLowerCase().includes(searchQuery) ||
        question.subtopic.toLowerCase().includes(searchQuery) ||
        question.subject.toLowerCase().includes(searchQuery)

      const matchesFilters =
        (!state.filters.exams.length || state.filters.exams.includes(question.exam)) &&
        (!state.filters.subjects.length ||
          state.filters.subjects.includes(question.subject)) &&
        (!state.filters.topics.length || state.filters.topics.includes(question.topic)) &&
        (!state.filters.subtopics.length ||
          state.filters.subtopics.includes(question.subtopic)) &&
        (!state.filters.difficulties.length ||
          state.filters.difficulties.includes(question.difficulty)) &&
        (!state.filters.years.length || state.filters.years.includes(question.year)) &&
        (!state.filters.types.length || state.filters.types.includes(question.type))

      return matchesSearch && matchesFilters
    })

    if (state.filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed)
    } else if (state.filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed)
    }

    return filtered
  }, [state.questions, state.filters, state.searchQuery])

  const paginatedQuestions = useMemo(() => {
    const endIndex = state.currentPage * PAGE_SIZE
    return filteredQuestions.slice(0, endIndex)
  }, [filteredQuestions, state.currentPage])

  const handleLoadMore = useCallback(() => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage + 1 })
  }, [state.currentPage])

  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      const filterValues = state.filters[tag]
      if (Array.isArray(filterValues)) {
        const isSelected = filterValues.includes(value)
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value]
        dispatch({
          type: "SET_FILTERS",
          payload: { ...state.filters, [tag]: updatedFilter },
        })
      }
    },
    [state.filters]
  )

  const updateUserPerformance = useCallback(
    async (
      questionId: string,
      updatedFields: Partial<QuestionType & Omit<UserPerformance, "timePerQuestion">>
    ) => {
      try {
        if (userId) {
          const response = await fetch("/api/user-performance/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, ...updatedFields }),
          })
          if (!response.ok) throw new Error("Failed to update user performance")
          
          // Update the local state
          dispatch({
            type: "UPDATE_QUESTION",
            payload: { questionId, updates: updatedFields },
          })
        }
      } catch (error) {
        console.error("Error updating user performance:", error)
      }
    },
    [userId]
  )

  const saveUserAnswer = useCallback(
    async (questionId: string, selectedOption: string, isCorrect: boolean) => {
      try {
        if (userId) {
          const response = await fetch("/api/user-answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedOption, isCorrect }),
          })
          if (!response.ok) throw new Error("Failed to save user answer")
        }
      } catch (error) {
        console.error("Error saving user answer:", error)
      }
    },
    [userId]
  )

  const handleMarkComplete = useCallback(
    async (questionId: string, isComplete: boolean) => {
      await updateUserPerformance(questionId, { completed: isComplete })
    },
    [updateUserPerformance]
  )

  const handleMarkForReview = useCallback(
    async (questionId: string, isReviewed: boolean) => {
      await updateUserPerformance(questionId, { reviewed: isReviewed })
    },
    [updateUserPerformance]
  )

  const handleOptionClick = useCallback(
    async (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption

      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" }
      const newSelectedOptions = { ...state.selectedOptions, [questionId]: option }

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelectedOptions })

      const updatedFields = {
        correctAnswers: isCorrect ? 1 : 0,
        incorrectAnswers: !isCorrect ? 1 : 0,
        uniqueQuestions: 1,
        questionsAttempted: 1,
        lastAttempted: new Date().toISOString(),
        completed: true,
        accuracy: isCorrect ? 100 : 0,
        firstAttemptSuccessRate: isCorrect ? 100 : 0,
        reattemptAccuracy: isCorrect ? 100 : 0,
      }

      await updateUserPerformance(questionId, updatedFields)
      await saveUserAnswer(questionId, option, isCorrect)
    },
    [saveUserAnswer, updateUserPerformance, state.feedback, state.selectedOptions]
  )

  const handleNumericalSubmit = useCallback(
    async (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer

      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" }
      dispatch({ type: "SET_FEEDBACK", payload: newFeedback })

      await updateUserPerformance(questionId, {
        lastAttempted: new  Date().toISOString(),
        completed: true,
        accuracy: isCorrect ? 100 : 0,
        firstAttemptSuccessRate: isCorrect ? 100 : 0,
        reattemptAccuracy: isCorrect ? 100 : 0,
      })
      await saveUserAnswer(questionId, userAnswer, isCorrect)
    },
    [saveUserAnswer, updateUserPerformance, state.feedback]
  )

  const handleNoteChange = useCallback(
    async (questionId: string, note: string) => {
      const newNotes = { ...state.notes, [questionId]: note }
      dispatch({ type: "SET_NOTES", payload: newNotes })

      try {
        if (userId) {
          const response = await fetch("/api/notes/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, content: note }),
          })
          if (!response.ok) throw new Error("Failed to save note")
        }
      } catch (error) {
        console.error("Error saving note:", error)
      }
    },
    [userId, state.notes]
  )

  const handleDeleteNote = useCallback(
    async (questionId: string) => {
      try {
        if (userId) {
          const response = await fetch("/api/notes/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId }),
          })
          if (!response.ok) throw new Error("Failed to delete note")
        }
      } catch (error) {
        console.error("Error deleting note:", error)
      }

      const newNotes = { ...state.notes, [questionId]: "" }
      dispatch({ type: "SET_NOTES", payload: newNotes })
    },
    [userId, state.notes]
  )

  if (state.loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
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
              <div key={i} className="mb-4 p-4 border rounded-md">
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

  return (
    <TooltipProvider>
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
            Question Bank
          </h1>

          <div className="flex space-x-4 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={state.searchQuery}
                  onChange={(e) =>
                    dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
                  }
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
              </TooltipTrigger>
              <TooltipContent>Search Questions</TooltipContent>
            </Tooltip>
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
                      <div className="w-full bg-white rounded-md p-2 sm:w-40">
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
                            value: !state.dropdowns[
                              filterType as keyof typeof state.dropdowns
                            ],
                          },
                        })
                      }
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
                          state.dropdowns[filterType as keyof typeof state.dropdowns]
                            ? "rotate-180"
                            : ""
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

          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question) => (
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
                  handleMarkschemeToggle={() =>
                    dispatch({
                      type: "SET_SHOW_MARKSCHEME",
                      payload: {
                        ...state.showMarkscheme,
                        [question.questionId]: !state.showMarkscheme[question.questionId],
                      },
                    })
                  }
                  handleMarkForReview={() =>
                    handleMarkForReview(question.questionId, !question.reviewed)
                  }
                  handleMarkComplete={() =>
                    handleMarkComplete(question.questionId, !question.completed)
                  }
                  isMarkedForReview={question.reviewed}
                  isMarkedComplete={question.completed}
                  markschemesDisabled={false}
                  note={state.notes[question.questionId] || ""}
                  handleNoteChange={handleNoteChange}
                  userId={userId}
                  handleDeleteNote={handleDeleteNote}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={paginatedQuestions.indexOf(question)}
                  handleQuestionChange={(index) => {
                    const newPage = Math.floor(index / PAGE_SIZE) + 1
                    if (newPage !== state.currentPage) {
                      dispatch({ type: "SET_CURRENT_PAGE", payload: newPage })
                    }
                  }}
                />
              ))}
              {paginatedQuestions.length < filteredQuestions.length && (
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              )}
            </>
          ) : (
            <p className="text-red-400">No questions found with the selected filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

const fetchData = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}

export default QuestionBank;
'use client'

import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Clock, AlertCircle, CheckCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Question from "@/components/shared/Question"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface QuestionType {
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
  markscheme?: string
}

interface FilterOptions {
  subjects: string[]
  difficulties: string[]
  topics: string[]
  subtopics: string[]
  years: string[]
}

interface ExamState {
  currentQuestion: number
  answers: Record<string, string>
  markedForReview: Set<number>
  timeLeft: number
}

type StateType = {
  questions: QuestionType[]
  filters: {
    subject: string
    difficulty: string
    topic: string
    subtopic: string
    year: string
    questionCount: number
  }
  filterOptions: FilterOptions
  feedback: Record<string, string>
  numericalAnswers: Record<string, string>
  loading: boolean
  examState: ExamState
  isExamMode: boolean
}

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: Partial<StateType['filters']> }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptions }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_EXAM_STATE"; payload: Partial<ExamState> }
  | { type: "SET_EXAM_MODE"; payload: boolean }

const initialState: StateType = {
  questions: [],
  filters: {
    subject: '',
    difficulty: '',
    topic: '',
    subtopic: '',
    year: '',
    questionCount: 10,
  },
  filterOptions: {
    subjects: [],
    difficulties: [],
    topics: [],
    subtopics: [],
    years: [],
  },
  feedback: {},
  numericalAnswers: {},
  loading: true,
  examState: {
    currentQuestion: 0,
    answers: {},
    markedForReview: new Set(),
    timeLeft: 10800, // 3 hours in seconds
  },
  isExamMode: false,
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload }
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload }
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload }
    case "SET_NUMERICAL_ANSWERS":
      return { ...state, numericalAnswers: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_EXAM_STATE":
      return { ...state, examState: { ...state.examState, ...action.payload } }
    case "SET_EXAM_MODE":
      return { ...state, isExamMode: action.payload }
    default:
      return state
  }
}

const MockExamContent: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { data: session, status } = useSession()

  const fetchFilterOptionsAndQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.filters),
      })
      const data = await response.json()
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data.filterOptions })
      dispatch({ type: "SET_QUESTIONS", payload: data.questions })
    } catch (error) {
      console.error("Error fetching filter options and questions:", error)
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.filters])

  useEffect(() => {
    if (status === "authenticated") {
      fetchFilterOptionsAndQuestions()
    }
  }, [fetchFilterOptionsAndQuestions, status])

  useEffect(() => {
    if (state.isExamMode) {
      const timer = setInterval(() => {
        dispatch({ 
          type: "SET_EXAM_STATE", 
          payload: { timeLeft: Math.max(0, state.examState.timeLeft - 1) } 
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [state.isExamMode, state.examState.timeLeft])

  const startExam = useCallback(() => {
    fetchFilterOptionsAndQuestions()
    dispatch({ type: "SET_EXAM_MODE", payload: true })
    dispatch({ 
      type: "SET_EXAM_STATE", 
      payload: { 
        currentQuestion: 0, 
        answers: {}, 
        markedForReview: new Set(), 
        timeLeft: 10800 
      } 
    })
  }, [fetchFilterOptionsAndQuestions])

  const generateRandomQuestions = useCallback(() => {
    const randomFilters = {
      subject: state.filterOptions.subjects[Math.floor(Math.random() * state.filterOptions.subjects.length)],
      difficulty: state.filterOptions.difficulties[Math.floor(Math.random() * state.filterOptions.difficulties.length)],
      topic: state.filterOptions.topics[Math.floor(Math.random() * state.filterOptions.topics.length)],
      subtopic: state.filterOptions.subtopics[Math.floor(Math.random() * state.filterOptions.subtopics.length)],
      year: state.filterOptions.years[Math.floor(Math.random() * state.filterOptions.years.length)],
      questionCount: state.filters.questionCount,
    }
    dispatch({ type: "SET_FILTERS", payload: randomFilters })
    startExam()
  }, [state.filterOptions, state.filters.questionCount, startExam])

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    dispatch({ 
      type: "SET_EXAM_STATE", 
      payload: { 
        answers: { ...state.examState.answers, [questionId]: answer } 
      } 
    })
  }, [state.examState.answers])

  const handleMarkForReview = useCallback((questionId: number) => {
    const newMarkedForReview = new Set(state.examState.markedForReview)
    if (newMarkedForReview.has(questionId)) {
      newMarkedForReview.delete(questionId)
    } else {
      newMarkedForReview.add(questionId)
    }
    dispatch({ 
      type: "SET_EXAM_STATE", 
      payload: { markedForReview: newMarkedForReview } 
    })
  }, [state.examState.markedForReview])

  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
    dispatch({ 
      type: "SET_EXAM_STATE", 
      payload: { 
        currentQuestion: direction === 'next'
          ? Math.min(state.examState.currentQuestion + 1, state.questions.length - 1)
          : Math.max(state.examState.currentQuestion - 1, 0)
      } 
    })
  }, [state.examState.currentQuestion, state.questions.length])

  const handleSubmit = useCallback(async () => {
    // Implement exam submission logic here
    console.log('Exam submitted:', state.examState.answers)
    dispatch({ type: "SET_EXAM_MODE", payload: false })
    // You would typically navigate to a results page or show a summary here
  }, [state.examState.answers])

  const handleDeleteNote = useCallback(async () => {
    // In exam mode, we're not allowing note deletion, but we still need to return a Promise
    return Promise.resolve()
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (status === "loading" || state.loading) {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Please sign in to access the exam system.</div>
  }

  if (!state.isExamMode) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Configure Your Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select 
              value={state.filters.subject} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { subject: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {state.filterOptions.subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={state.filters.difficulty} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { difficulty: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {state.filterOptions.difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={state.filters.topic} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { topic: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {state.filterOptions.topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={state.filters.subtopic} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { subtopic: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subtopic" />
              </SelectTrigger>
              <SelectContent>
                {state.filterOptions.subtopics.map((subtopic) => (
                  <SelectItem key={subtopic} value={subtopic}>{subtopic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={state.filters.year} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { year: value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {state.filterOptions.years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={state.filters.questionCount.toString()} 
              onValueChange={(value) => dispatch({ type: "SET_FILTERS", payload: { questionCount: parseInt(value) } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={startExam} className="w-1/2 mr-2">
            Start Exam
          </Button>
          <Button onClick={generateRandomQuestions} className="w-1/2 ml-2">
            Random
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const currentQuestion = state.questions[state.examState.currentQuestion]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">{session?.user?.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mock Exam</p>
                </div>
              </div>
              <div  className="flex items-center space-x-4">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(state.examState.timeLeft)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Question
                question={currentQuestion}
                feedback={state.feedback[currentQuestion.questionId]}
                selectedOption={state.examState.answers[currentQuestion.questionId]}
                numericalAnswer={state.numericalAnswers[currentQuestion.questionId]}
                showMarkscheme={false}
                handleOptionClick={(questionId, option) => handleAnswer(questionId, option)}
                handleNumericalSubmit={(questionId, answer) => handleAnswer(questionId, answer)}
                handleNumericalChange={(questionId, value) => {
                  dispatch({ type: "SET_NUMERICAL_ANSWERS", payload: { ...state.numericalAnswers, [questionId]: value } })
                }}
                handleMarkschemeToggle={() => {
                  // Disable markscheme toggle in exam mode
                }}
                handleMarkForReview={() => handleMarkForReview(state.examState.currentQuestion)}
                handleMarkComplete={() => {
                  // Mark as complete when answered in exam mode
                }}
                isMarkedForReview={state.examState.markedForReview.has(state.examState.currentQuestion)}
                isMarkedComplete={!!state.examState.answers[currentQuestion.questionId]}
                markschemesDisabled={true}
                note=""
                handleNoteChange={() => {
                  // Disable note changes in exam mode
                }}
                handleDeleteNote={handleDeleteNote}
                totalQuestions={state.questions.length}
                currentQuestionIndex={state.examState.currentQuestion}
                handleQuestionChange={(index) => {
                  dispatch({ type: "SET_EXAM_STATE", payload: { currentQuestion: index } })
                }}
                userId={session?.user?.id || ''}
              />
              <div className="flex justify-between">
                <Button onClick={() => handleNavigation('prev')} disabled={state.examState.currentQuestion === 0}>
                  Previous
                </Button>
                <Button onClick={() => handleNavigation('next')} disabled={state.examState.currentQuestion === state.questions.length - 1}>
                  Next
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm">{state.questions.length - Object.keys(state.examState.answers).length} Not Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{Object.keys(state.examState.answers).length} Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">{state.examState.markedForReview.size} Marked for Review</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Navigator</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-5 gap-2">
                      {state.questions.map((_, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className={`h-10 w-10 p-0 ${
                                state.examState.answers[index] ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-800' :
                                state.examState.markedForReview.has(index) ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200  dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800' :
                                index === state.examState.currentQuestion ? 'bg-gray-200 text-gray-800 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500' :
                                'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => dispatch({ type: "SET_EXAM_STATE", payload: { currentQuestion: index } })}
                            >
                              {index + 1}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {state.examState.answers[index] ? 'Answered' : 
                             state.examState.markedForReview.has(index) ? 'Marked for Review' : 
                             'Not Answered'}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Button onClick={handleSubmit} 
                className="w-full bg-green-600 text-white hover:bg-green-700">
                Submit Exam
              </Button>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <Progress value={(state.examState.timeLeft / 10800) * 100} className="h-full" />
        </div>
      </div>
    </TooltipProvider>
  )
}

export default MockExamContent;
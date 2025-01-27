"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import ExamSetup from "./exam-setup"
import Exam from "./exam"
import AdvancedExamResults from "./exam-results"

// Single source of truth for types
import {
  QuestionType,
  ExamResultsType,
  TopicPerformance,
} from "@/lib/exam-helpers"
import { Button } from "@/components/ui/button"

const HOUR_IN_SECONDS = 3600

export default function MockExam() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // ------------------------------------------------------------------
  // State for exam, year, shift
  // ------------------------------------------------------------------
  const [exams, setExams] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [shifts, setShifts] = useState<string[]>([])

  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedShift, setSelectedShift] = useState("") // or paperId

  // Timer settings
  const [examTime, setExamTime] = useState<number>(60)

  // Questions once chosen
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([])

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)

  // For answering and results
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>({})
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS)
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)

  const questionStartTimeRef = useRef<number>(0)

  // ------------------------------------------------------------------
  // 1) Fetch the list of exams, years, shifts on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    fetchExamsAndYears()
  }, [])

  async function fetchExamsAndYears() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/exams-and-years")
      if (!response.ok) {
        throw new Error("Failed to fetch exams/years/shifts.")
      }
      const data = await response.json()

      setExams(data.exams || [])
      setYears(data.years || [])
      setShifts(data.shifts || [])
    } catch (error) {
      console.error("Error fetching exam data:", error)
      toast({
        title: "Error",
        description: "Failed to load exam/year/shift data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // 2) Start the exam => fetch questions for selected exam, year, shift
  // ------------------------------------------------------------------
  async function startExam() {
    if (!selectedExam || !selectedYear || !selectedShift) {
      toast({
        title: "Validation Error",
        description: "Please select an exam, year, and shift before starting.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const queryParams = new URLSearchParams({
        exam: selectedExam,
        year: String(selectedYear),
        shift: selectedShift, // or "paperId" if you prefer
      })

      // e.g. /api/questions?exam=JEE-Main&year=2022&shift=Shift-1
      const response = await fetch(`/api/questions?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch questions for the selected exam/year/shift.")
      }

      const data = await response.json()
      // If paginated => data.data, else just data
      const matching = data.data ?? data

      setFilteredQuestions(matching)

      // Initialize statuses, answers, time
      const initialStatuses: { [index: number]: string } = {}
      matching.forEach((_: any, i: number) => {
        initialStatuses[i] = "notVisited"
      })
      setQuestionStatuses(initialStatuses)
      setAnswers(new Array(matching.length).fill(null))
      setTimeSpentPerQuestion(new Array(matching.length).fill(0))

      // Convert minutes to seconds
      setExamTimeLeft(examTime * 60)

      setIsExamStarted(true)
      setIsExamFinished(false)
      setExamResults(null)
      setCurrentQuestion(0)

      questionStartTimeRef.current = Date.now()
    } catch (error) {
      console.error("Error loading exam questions:", error)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // 3) Handling answers, statuses, navigation
  // ------------------------------------------------------------------
  const handleAnswer = useCallback(
    (answerId: string) => {
      setAnswers((prev) => {
        const newArr = [...prev]
        newArr[currentQuestion] = answerId
        return newArr
      })
      setQuestionStatuses((prev) => {
        const oldStatus = prev[currentQuestion]
        return {
          ...prev,
          [currentQuestion]:
            oldStatus === "markedForReview" ? "markedForReview" : "answered",
        }
      })
    },
    [currentQuestion]
  )

  const handleClear = useCallback(() => {
    setAnswers((prev) => {
      const newArr = [...prev]
      newArr[currentQuestion] = null
      return newArr
    })
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]:
        prev[currentQuestion] === "markedForReview"
          ? "markedForReview"
          : "notAnswered",
    }))
  }, [currentQuestion])

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]: "markedForReview",
    }))
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1)
    }
  }, [currentQuestion, filteredQuestions.length])

  const handleSaveAndNext = useCallback(() => {
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1)
    }
  }, [currentQuestion, filteredQuestions.length])

  // ------------------------------------------------------------------
  // 4) Navigation with time tracking
  // ------------------------------------------------------------------
  function updateTimeSpent() {
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    setTimeSpentPerQuestion((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestion] =
        (newTimeSpent[currentQuestion] || 0) + timeSpent
      return newTimeSpent
    })
    questionStartTimeRef.current = Date.now()
  }

  function handleNavigate(index: number) {
    if (index < 0 || index >= filteredQuestions.length) return
    updateTimeSpent()
    setCurrentQuestion(index)
    setQuestionStatuses((prev) => {
      const st = prev[index]
      if (st === "notVisited") {
        return { ...prev, [index]: "notAnswered" }
      }
      return prev
    })
  }

  function handleNext() {
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1)
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      handleNavigate(currentQuestion - 1)
    }
  }

  // ------------------------------------------------------------------
  // 5) Submitting the exam
  // ------------------------------------------------------------------
  function handleSubmit() {
    if (!filteredQuestions.length) return
    updateTimeSpent()

    const totalQuestions = filteredQuestions.length
    const correctCount = filteredQuestions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correctOption ? 1 : 0)
    }, 0)
    const incorrectAnswers = totalQuestions - correctCount
    const score = (correctCount / totalQuestions) * 100

    // Example topic performance logic
    const topicPerformance: Record<string, TopicPerformance> = {}
    const subtopicPerformance: Record<string, TopicPerformance> = {}
    const topicWiseIncorrectAnswers: Record<string, number> = {}

    filteredQuestions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctOption
      const top = q.topic || "Unknown Topic"
      if (!topicPerformance[top]) {
        topicPerformance[top] = { correct: 0, total: 0 }
      }
      topicPerformance[top].total++
      if (isCorrect) {
        topicPerformance[top].correct++
      } else {
        topicWiseIncorrectAnswers[top] =
          (topicWiseIncorrectAnswers[top] || 0) + 1
      }

      const sub = q.subtopic || "No Subtopic"
      if (!subtopicPerformance[sub]) {
        subtopicPerformance[sub] = { correct: 0, total: 0 }
      }
      subtopicPerformance[sub].total++
      if (isCorrect) {
        subtopicPerformance[sub].correct++
      }
    })

    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3)

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3)

    const avgTimePerQ =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) /
      timeSpentPerQuestion.length

    // Example: random skill levels
    const skillLevels: Record<string, number> = {
      "Problem Solving": Math.random() * 100,
      "Critical Thinking": Math.random() * 100,
      "Data Analysis": Math.random() * 100,
      "Conceptual Understanding": Math.random() * 100,
      "Application of Knowledge": Math.random() * 100,
    }

    setExamResults({
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswers,
      score,
      topicPerformance,
      subtopicPerformance,
      topStrengths,
      topWeaknesses,
      userAnswers: answers.map((a) => a || ""),
      correctAnswers: filteredQuestions.map((q) => q.correctOption),
      timeSpentPerQuestion,
      averageTimePerQuestion: avgTimePerQ,
      topicWiseIncorrectAnswers,
      questions: filteredQuestions,
      skillLevels,
    })

    setIsExamFinished(true)
  }

  // ------------------------------------------------------------------
  // 6) Exam timer
  // ------------------------------------------------------------------
  useEffect(() => {
    let examTimer: NodeJS.Timeout
    if (isExamStarted && !isExamFinished) {
      examTimer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(examTimer)
            updateTimeSpent()
            handleSubmit() // automatically submit
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (examTimer) clearInterval(examTimer)
    }
  }, [isExamStarted, isExamFinished])

  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestion, isExamStarted, isExamFinished])

  // ------------------------------------------------------------------
  // 7) Early exit exam
  // ------------------------------------------------------------------
  function exitExam() {
    if (
      window.confirm(
        "Are you sure you want to exit the exam? Your progress will be lost."
      )
    ) {
      setIsExamStarted(false)
      setIsExamFinished(false)
      setExamResults(null)
      router.push("/mock-exam")
    }
  }

  function onStartNewExam() {
    setIsExamStarted(false)
    setIsExamFinished(false)
    setExamResults(null)
  }

  // ------------------------------------------------------------------
  // 8) Loading skeleton (only for initial load)
  // ------------------------------------------------------------------
  if (isLoading && !isExamStarted && !isExamFinished) {
    return (
      <div className="min-h-screen w-full flex flex-col p-4 md:p-8">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton circle width={64} height={64} />
            <Skeleton width={200} height={40} />
          </div>
          <Skeleton width={300} height={40} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton circle width={48} height={48} />
              <Skeleton width={150} height={32} />
            </div>
            <Skeleton count={4} height={24} className="mb-2" />
            <Skeleton width={150} height={48} className="mt-4" />
          </div>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // 9) Render the 3 states (Setup -> Exam -> Results)
  // ------------------------------------------------------------------
  return (
    <AnimatePresence mode="wait">
      {/* 1) exam setup */}
      {!isExamStarted && !isExamFinished && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ExamSetup
            exams={exams}
            years={years}
            shifts={shifts}
            selectedExam={selectedExam}
            selectedYear={selectedYear}
            selectedShift={selectedShift}
            examTime={examTime}
            onExamChange={setSelectedExam}
            onYearChange={(val) => setSelectedYear(Number(val))}
            onShiftChange={setSelectedShift}
            onExamTimeChange={setExamTime}
            onStartExam={startExam}
          />
        </motion.div>
      )}

      {/* 2) exam in progress */}
      {isExamStarted && !isExamFinished && (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50"
        >
          <Exam
            currentQuestion={currentQuestion}
            filteredQuestions={filteredQuestions}
            answers={answers}
            questionStatuses={questionStatuses}
            questionStatusCounts={calcStatusCounts(questionStatuses)}
            examTimeLeft={examTimeLeft}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onClear={handleClear}
            onReviewAndNext={handleReviewAndNext}
            onSaveAndNext={handleSaveAndNext}
            onSubmit={() => {
              if (window.confirm("Are you sure you want to submit the exam?")) {
                handleSubmit()
              }
            }}
            onExit={exitExam}
            onNavigate={handleNavigate}
            userName={session?.user?.name || "Guest User"}
            selectedSubject={""}
            selectedYear={String(selectedYear)}
            selectedLevel={""}
          />
        </motion.div>
      )}

      {/* 3) exam results */}
      {isExamFinished && examResults && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AdvancedExamResults
            examResults={examResults}
            onStartNewExam={onStartNewExam}
            onExit={() => setIsExamFinished(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper to count statuses
function calcStatusCounts(obj: { [index: number]: string }) {
  const counts = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    markedForReview: 0,
  }
  for (const status of Object.values(obj)) {
    if (counts[status as keyof typeof counts] !== undefined) {
      counts[status as keyof typeof counts]++
    }
  }
  return counts
}

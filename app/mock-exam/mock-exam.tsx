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

// IMPORTANT: We import the single source of truth for QuestionType
import { QuestionType, ExamResultsType, TopicPerformance } from "@/lib/exam-helpers"
import { Button } from "@/components/ui/button"

const HOUR_IN_SECONDS = 3600

export default function MockExam() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // All questions from DB
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([])
  // Filtered set matching exam + year
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([])

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>({})
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])

  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)

  const [exams, setExams] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])

  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [examTime, setExamTime] = useState<number>(60) // default 60 min

  const [isLoading, setIsLoading] = useState(true)
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)

  const questionStartTimeRef = useRef<number>(0)

  // 1) If we use a function declaration, it’s hoisted, so no “used before assigned” error:
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
        topicWiseIncorrectAnswers[top] = (topicWiseIncorrectAnswers[top] || 0) + 1
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
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) / timeSpentPerQuestion.length

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

  // 2) Then we can define other logic or hooks:

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

  // etc.

  // ---------- FETCH -----------
  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    try {
      const response = await fetch("/api/questions")
      if (!response.ok) {
        throw new Error("Failed to fetch questions")
      }
      const data: QuestionType[] = await response.json()
      setAllQuestions(data)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // EXAMS + YEARS
  useEffect(() => {
    if (allQuestions.length > 0) {
      const uniqueExams = Array.from(
        new Set(allQuestions.map((q) => q.exam).filter(Boolean))
      ) as string[]
      setExams(uniqueExams)
    }
  }, [allQuestions])

  useEffect(() => {
    if (selectedExam) {
      const uniqueYears = Array.from(
        new Set(
          allQuestions
            .filter((q) => q.exam === selectedExam)
            .map((q) => q.year)
            .filter(Boolean)
        )
      ) as string[]
      setYears(uniqueYears)
    }
  }, [selectedExam, allQuestions])

  // ---------- EXAM START -----------
  function startExam() {
    // Filter for exam + year
    const matching = allQuestions.filter(
      (q) => q.exam === selectedExam && q.year === selectedYear
    )

    setFilteredQuestions(matching)

    // Make statuses
    const initialStatuses: { [index: number]: string } = {}
    matching.forEach((_, i) => {
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
  }

  // ---------- ANSWERING -----------
  const handleAnswer = useCallback((answerId: string) => {
    setAnswers((prev) => {
      const newArr = [...prev]
      newArr[currentQuestion] = answerId
      return newArr
    })
    setQuestionStatuses((prev) => {
      const oldStatus = prev[currentQuestion]
      return {
        ...prev,
        [currentQuestion]: oldStatus === "markedForReview" ? "markedForReview" : "answered",
      }
    })
  }, [currentQuestion])

  const handleClear = useCallback(() => {
    setAnswers((prev) => {
      const newArr = [...prev]
      newArr[currentQuestion] = null
      return newArr
    })
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]:
        prev[currentQuestion] === "markedForReview" ? "markedForReview" : "notAnswered",
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

  // ---------- NAVIGATION -----------
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

  // ---------- EXAM TIMER -----------
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

  // exit exam early
  function exitExam() {
    if (window.confirm("Are you sure you want to exit the exam? Your progress will be lost.")) {
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

  // Loading skeleton
  if (isLoading) {
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

  return (
    <AnimatePresence mode="wait">
      {/* 1) exam setup */}
      {!isExamStarted && (
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
            selectedExam={selectedExam}
            selectedYear={selectedYear}
            examTime={examTime}
            onExamChange={setSelectedExam}
            onYearChange={setSelectedYear}
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
            selectedSubject=""
            selectedYear={selectedYear}
            selectedLevel=""
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

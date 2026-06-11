"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

import ExamSetup from "./exam-setup"
import Exam from "./exam"
import AdvancedExamResults from "./exam-results"

import {
  QuestionType,
  ExamResultsType,
  TopicPerformance,
  normalizeQuestion,
  gradeAnswer,
  displayCorrectAnswer,
} from "@/lib/exam-helpers"

const HOUR_IN_SECONDS = 3600

/** A simple skeleton UI for when the exam is loading after Start Exam is clicked. */
function ExamLoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-4">
        <Skeleton height={30} width={"60%"} />
        <Skeleton height={20} count={2} />
        <Skeleton height={200} />
        <Skeleton height={40} />
      </div>

      <div className="w-full max-w-3xl space-y-2 mt-10">
        <Skeleton height={30} width={"50%"} />
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </div>
    </div>
  )
}

export default function MockExam() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // ---------------------------
  // 1) User selections
  // ---------------------------
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedYearKey, setSelectedYearKey] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined)
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false)
  const [examTime, setExamTime] = useState<number>(60)

  const [numQuestions, setNumQuestions] = useState<number>(0)

  // ---------------------------
  // 2) Questions from DB
  // ---------------------------
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([])

  // ---------------------------
  // 3) Exam states
  // ---------------------------
  const [isLoading, setIsLoading] = useState(false) // fetching data
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>(
    {}
  )
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS)
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)

  // Keep track of when we land on a question
  const questionStartTimeRef = useRef<number>(0)

  // ----------------------------------------------------------------
  // 1) Called by <ExamSetup> => user clicked "Start Exam"
  // ----------------------------------------------------------------
  async function handleStartExam(params: {
    exam: string
    year: number
    yearKey?: string
    examTime?: number
    skipCompleted?: boolean
    difficulty?: string
    selectedTopics?: string[]
  }) {
    const {
      exam,
      year,
      yearKey = "",
      examTime = 60,
      skipCompleted = false,
      difficulty,
      selectedTopics = [],
    } = params

    setIsLoading(true)

    try {
      const query = new URLSearchParams()
      query.set("exam", exam)
      query.set("year", String(year))
      query.set("page", "1")
      query.set("pageSize", "9999")

      if (yearKey) query.set("yearKey", yearKey)
      if (selectedTopics.length > 0) {
        query.set("topic", selectedTopics.join(","))
      }
      if (skipCompleted) query.set("skipCompleted", "true")
      if (difficulty) query.set("difficulty", difficulty)

      const res = await fetch(`/api/questions?${query.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to fetch questions.")
      }

      const data = await res.json()
      const questions: QuestionType[] = (data.data ?? []).map(normalizeQuestion)

      if (!questions || questions.length === 0) {
        toast({
          title: "No Questions Found",
          description: "No matches. Try different filters.",
          variant: "destructive",
        })
        return
      }

      // update local states
      setSelectedExam(exam)
      setSelectedYear(year)
      setSelectedYearKey(yearKey)
      setExamTime(examTime)
      setSkipCompleted(skipCompleted)
      setDifficulty(difficulty)
      setSelectedTopics(selectedTopics)

      setNumQuestions(questions.length)

      // start the exam
      initializeExam(questions, examTime)
      setIsExamStarted(true)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function initializeExam(questions: QuestionType[], examTimeInMinutes: number) {
    setFilteredQuestions(questions)

    const initStatuses: { [index: number]: string } = {}
    questions.forEach((_, i) => {
      initStatuses[i] = "notVisited"
    })
    setQuestionStatuses(initStatuses)

    setAnswers(new Array(questions.length).fill(null))
    setTimeSpentPerQuestion(new Array(questions.length).fill(0))
    setExamTimeLeft(examTimeInMinutes * 60)

    setIsExamFinished(false)
    setExamResults(null)
    setCurrentQuestion(0)

    questionStartTimeRef.current = Date.now()
  }

  // ----------------------------------------------------------------
  // 2) Handling answers
  // ----------------------------------------------------------------
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
    setQuestionStatuses((prev) => {
      if (prev[currentQuestion] === "markedForReview") {
        return { ...prev, [currentQuestion]: "markedForReview" }
      }
      return { ...prev, [currentQuestion]: "notAnswered" }
    })
  }, [currentQuestion])

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]: "markedForReview",
    }))
    handleNext()
  }, [currentQuestion])

  const handleSaveAndNext = useCallback(() => {
    handleNext()
  }, [currentQuestion])

  function updateTimeSpent() {
    const delta = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    setTimeSpentPerQuestion((prev) => {
      const copy = [...prev]
      copy[currentQuestion] = (copy[currentQuestion] || 0) + delta
      return copy
    })
    questionStartTimeRef.current = Date.now()
  }

  function handleNavigate(index: number) {
    if (index < 0 || index >= filteredQuestions.length) return
    updateTimeSpent()
    setCurrentQuestion(index)

    // if "notVisited", mark as "notAnswered"
    setQuestionStatuses((prev) => {
      if (prev[index] === "notVisited") {
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

  // ----------------------------------------------------------------
  // 3) Submitting
  // ----------------------------------------------------------------
  function handleSubmit() {
    if (!filteredQuestions.length) return
    updateTimeSpent()

    const totalQuestions = filteredQuestions.length

    // Grade each question with the shared grader. `null` => not auto-gradable
    // (Subjective, or no answer key) and is excluded from the score.
    const grades = filteredQuestions.map((q, i) => gradeAnswer(q, answers[i]))
    const gradedQuestions = grades.filter((g) => g !== null).length
    const correctCount = grades.filter((g) => g === true).length
    const incorrectAnswers = gradedQuestions - correctCount
    const ungradedQuestions = totalQuestions - gradedQuestions
    const score = gradedQuestions > 0 ? (correctCount / gradedQuestions) * 100 : 0

    const topicPerformance: Record<string, TopicPerformance> = {}
    const subtopicPerformance: Record<string, TopicPerformance> = {}
    const topicWiseIncorrectAnswers: Record<string, number> = {}

    filteredQuestions.forEach((q, i) => {
      const grade = grades[i]
      if (grade === null) return // skip ungradable in topic stats

      const isCorrect = grade === true
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

    // sort top/bottom
    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3)

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3)

    const avgTimePerQ =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) /
      timeSpentPerQuestion.length

    // example mock skill levels
    const skillLevels: Record<string, number> = {
      "Problem Solving": Math.random() * 100,
      "Critical Thinking": Math.random() * 100,
      "Data Analysis": Math.random() * 100,
      "Conceptual Understanding": Math.random() * 100,
      "Application of Knowledge": Math.random() * 100,
    }

    setExamResults({
      totalQuestions,
      gradedQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswers,
      ungradedQuestions,
      score,
      topicPerformance,
      subtopicPerformance,
      topStrengths,
      topWeaknesses,
      userAnswers: answers.map((a) => a || ""),
      correctAnswers: filteredQuestions.map((q) => displayCorrectAnswer(q)),
      timeSpentPerQuestion,
      averageTimePerQuestion: avgTimePerQ,
      topicWiseIncorrectAnswers,
      questions: filteredQuestions,
      skillLevels,
    })

    setIsExamFinished(true)
  }

  // ----------------------------------------------------------------
  // 4) Timer => auto submit
  // ----------------------------------------------------------------
  // Tick only. The interval must NOT call handleSubmit() directly — it would
  // close over the answers captured when the exam started (all null), so a
  // time-out auto-submit would grade an empty paper. Submission is fired from
  // a separate effect below that runs in a render with the CURRENT answers.
  useEffect(() => {
    if (!isExamStarted || isExamFinished) return
    const examTimer = setInterval(() => {
      setExamTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(examTimer)
  }, [isExamStarted, isExamFinished])

  // Auto-submit when the timer expires (current state, not the stale snapshot).
  useEffect(() => {
    if (isExamStarted && !isExamFinished && examTimeLeft === 0) {
      updateTimeSpent()
      handleSubmit()
    }
    // updateTimeSpent/handleSubmit intentionally omitted: fire once on expiry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTimeLeft, isExamStarted, isExamFinished])

  // track question start time
  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestion, isExamStarted, isExamFinished])

  // ----------------------------------------------------------------
  // 5) Exiting or new exam
  // ----------------------------------------------------------------
  function exitExam() {
    if (window.confirm("Are you sure you want to exit? Progress will be lost.")) {
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

    setSelectedExam("")
    setSelectedYear(null)
    setSelectedYearKey("")
    setExamTime(60)
    setSkipCompleted(false)
    setDifficulty(undefined)
    setSelectedTopics([])
    setNumQuestions(0)
  }

  // ----------------------------------------------------------------
  // 6) Render flow
  // ----------------------------------------------------------------
  return (
    <AnimatePresence mode="wait">
      {/* 6a) Setup */}
      {!isExamStarted && !isExamFinished && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ExamSetup
            onStartExam={handleStartExam}
            isLoading={isLoading}
            currentNumQuestions={numQuestions}
          />
        </motion.div>
      )}

      {/* 6b) Loading skeleton if exam is started but data is still loading */}
      {isExamStarted && !isExamFinished && isLoading && (
        <motion.div
          key="exam-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-white overflow-y-auto custom-scrollbar"
        >
          <ExamLoadingSkeleton />
        </motion.div>
      )}

      {/* 6c) Actual exam */}
      {isExamStarted && !isExamFinished && !isLoading && (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar"
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
              if (window.confirm("Are you sure you want to submit?")) {
                handleSubmit()
              }
            }}
            onExit={exitExam}
            onNavigate={handleNavigate}
            userName={session?.user?.name || "Guest"}
            selectedSubject={selectedExam}
            selectedYear={String(selectedYear || "")}
            selectedLevel={selectedYearKey}
          />
        </motion.div>
      )}

      {/* 6d) Results */}
      {isExamFinished && examResults && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
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

/** Count question statuses so we can display them in the UI. */
function calcStatusCounts(obj: { [index: number]: string }) {
  const counts = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    markedForReview: 0,
  }
  for (const st of Object.values(obj)) {
    if (st in counts) {
      counts[st as keyof typeof counts]++
    }
  }
  return counts
}

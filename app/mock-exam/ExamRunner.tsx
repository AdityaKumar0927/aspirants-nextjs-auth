"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

import Exam from "./exam"
import AdvancedExamResults from "./exam-results"

import {
  QuestionType,
  ExamResultsType,
  TopicPerformance,
  gradeAnswer,
  displayCorrectAnswer,
} from "@/lib/exam-helpers"

/**
 * The mock-exam ENGINE: timer, navigation, answer state, grading + results.
 * Extracted from mock-exam.tsx so it can be reused by both the global Mock Exam
 * (questions fetched from /api/questions) and a private bank (questions injected).
 * Purely prop-driven — no /api/questions fetch, no exam/year setup, no session.
 * It mounts once per attempt (the parent remounts it for a new attempt).
 */
export interface ExamRunnerProps {
  questions: QuestionType[] // already normalized
  examTimeMinutes: number
  userName: string
  subject: string // masthead label (e.g. exam name or bank title)
  year?: string
  level?: string
  /** Override the results marksheet title (e.g. a bank's name). */
  paperTitle?: string
  /** Leave the attempt (the in-exam "Exit"). */
  onExit: () => void
  /** Results screen "Start new exam". */
  onStartNewExam: () => void
  /** Persist the result (e.g. a bank PATCH). Optional. */
  onSaveResult?: (results: ExamResultsType) => void
}

function calcStatusCounts(obj: { [index: number]: string }) {
  const counts = { notVisited: 0, notAnswered: 0, answered: 0, markedForReview: 0 }
  for (const st of Object.values(obj)) {
    if (st in counts) counts[st as keyof typeof counts]++
  }
  return counts
}

export default function ExamRunner({
  questions,
  examTimeMinutes,
  userName,
  subject,
  year = "",
  level = "",
  paperTitle,
  onExit,
  onStartNewExam,
  onSaveResult,
}: ExamRunnerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    new Array(questions.length).fill(null)
  )
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>(() => {
    const init: { [index: number]: string } = {}
    questions.forEach((_, i) => (init[i] = "notVisited"))
    return init
  })
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>(() =>
    new Array(questions.length).fill(0)
  )
  const [examTimeLeft, setExamTimeLeft] = useState(() => examTimeMinutes * 60)
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)
  const [isFinished, setIsFinished] = useState(false)

  const questionStartTimeRef = useRef<number>(Date.now())

  const handleAnswer = useCallback(
    (answerId: string) => {
      setAnswers((prev) => {
        const next = [...prev]
        next[currentQuestion] = answerId
        return next
      })
      setQuestionStatuses((prev) => {
        const old = prev[currentQuestion]
        return { ...prev, [currentQuestion]: old === "markedForReview" ? "markedForReview" : "answered" }
      })
    },
    [currentQuestion]
  )

  const handleClear = useCallback(() => {
    setAnswers((prev) => {
      const next = [...prev]
      next[currentQuestion] = null
      return next
    })
    setQuestionStatuses((prev) =>
      prev[currentQuestion] === "markedForReview"
        ? { ...prev, [currentQuestion]: "markedForReview" }
        : { ...prev, [currentQuestion]: "notAnswered" }
    )
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
    if (index < 0 || index >= questions.length) return
    updateTimeSpent()
    setCurrentQuestion(index)
    setQuestionStatuses((prev) =>
      prev[index] === "notVisited" ? { ...prev, [index]: "notAnswered" } : prev
    )
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) handleNavigate(currentQuestion + 1)
  }
  function handlePrevious() {
    if (currentQuestion > 0) handleNavigate(currentQuestion - 1)
  }

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => ({ ...prev, [currentQuestion]: "markedForReview" }))
    handleNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion])

  const handleSaveAndNext = useCallback(() => {
    handleNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion])

  function handleSubmit() {
    if (!questions.length) return
    updateTimeSpent()

    const totalQuestions = questions.length
    const grades = questions.map((q, i) => gradeAnswer(q, answers[i]))
    const gradedQuestions = grades.filter((g) => g !== null).length
    const correctCount = grades.filter((g) => g === true).length
    const incorrectAnswers = gradedQuestions - correctCount
    const ungradedQuestions = totalQuestions - gradedQuestions
    const score = gradedQuestions > 0 ? (correctCount / gradedQuestions) * 100 : 0

    const topicPerformance: Record<string, TopicPerformance> = {}
    const subtopicPerformance: Record<string, TopicPerformance> = {}
    const topicWiseIncorrectAnswers: Record<string, number> = {}

    questions.forEach((q, i) => {
      const grade = grades[i]
      if (grade === null) return
      const isCorrect = grade === true
      const top = q.topic || "Unknown Topic"
      if (!topicPerformance[top]) topicPerformance[top] = { correct: 0, total: 0 }
      topicPerformance[top].total++
      if (isCorrect) topicPerformance[top].correct++
      else topicWiseIncorrectAnswers[top] = (topicWiseIncorrectAnswers[top] || 0) + 1

      const sub = q.subtopic || "No Subtopic"
      if (!subtopicPerformance[sub]) subtopicPerformance[sub] = { correct: 0, total: 0 }
      subtopicPerformance[sub].total++
      if (isCorrect) subtopicPerformance[sub].correct++
    })

    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3)
    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3)

    const avgTimePerQ =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) / (timeSpentPerQuestion.length || 1)

    const skillLevels: Record<string, number> = {
      "Problem Solving": Math.random() * 100,
      "Critical Thinking": Math.random() * 100,
      "Data Analysis": Math.random() * 100,
      "Conceptual Understanding": Math.random() * 100,
      "Application of Knowledge": Math.random() * 100,
    }

    const results: ExamResultsType = {
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
      correctAnswers: questions.map((q) => displayCorrectAnswer(q)),
      timeSpentPerQuestion,
      averageTimePerQuestion: avgTimePerQ,
      topicWiseIncorrectAnswers,
      questions,
      skillLevels,
    }

    setExamResults(results)
    setIsFinished(true)
    onSaveResult?.(results)
  }

  // Tick only — submission is fired by the effect below with current answers.
  useEffect(() => {
    if (isFinished) return
    const t = setInterval(() => setExamTimeLeft((prev) => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(t)
  }, [isFinished])

  useEffect(() => {
    if (!isFinished && examTimeLeft === 0) {
      updateTimeSpent()
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTimeLeft, isFinished])

  useEffect(() => {
    if (!isFinished) questionStartTimeRef.current = Date.now()
  }, [currentQuestion, isFinished])

  return (
    <AnimatePresence mode="wait">
      {!isFinished ? (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-desk custom-scrollbar"
        >
          <Exam
            currentQuestion={currentQuestion}
            filteredQuestions={questions}
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
              if (window.confirm("Submit the paper? You can't change answers after this.")) {
                handleSubmit()
              }
            }}
            onExit={onExit}
            onNavigate={handleNavigate}
            userName={userName}
            selectedSubject={subject}
            selectedYear={year}
            selectedLevel={level}
          />
        </motion.div>
      ) : examResults ? (
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
            onExit={() => setIsFinished(false)}
            paperTitle={paperTitle}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

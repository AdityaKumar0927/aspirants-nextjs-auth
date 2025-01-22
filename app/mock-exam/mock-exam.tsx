"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import ExamSetup from "./exam-setup"
import Exam from "./exam"
import AdvancedExamResults from "./exam-results"
import { QuestionType, ExamResultsType, TopicPerformance } from "@/lib/exam-helpers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"


const HOUR_IN_SECONDS = 3600

export default function MockExam() {
  const router = useRouter()
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [questionStatuses, setQuestionStatuses] = useState<{
    [index: number]: string
  }>({})
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [isExamFinished, setIsExamFinished] = useState(false)
  const [exams, setExams] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10)
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false)
  const [examTime, setExamTime] = useState<number>(60)
  const [isLoading, setIsLoading] = useState(true)
  const [examMode, setExamMode] = useState<"past" | "custom">("past")
  const { data: session } = useSession()
  const { toast } = useToast()
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)
  const questionStartTimeRef = useRef<number>(0)
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])
  const [darkMode, setDarkMode] = useState(false)

  const filteredQuestions = useMemo(() => {
    if (examMode === "past") {
      return allQuestions.filter(
        (q) =>
          q.exam === selectedExam &&
          q.subject === selectedSubject &&
          q.year === selectedYear
      )
    } else {
      return (
        allQuestions
          .filter(
            (q) =>
              q.exam === selectedExam &&
              q.subject === selectedSubject &&
              q.year === selectedYear
          )
          .slice(0, numberOfQuestions) || []
      )
    }
  }, [
    allQuestions,
    examMode,
    selectedExam,
    selectedSubject,
    selectedYear,
    numberOfQuestions,
  ])

  useEffect(() => {
    if (isExamStarted) {
      const initialStatuses: { [index: number]: string } = {}
      filteredQuestions.forEach((_, index) => {
        initialStatuses[index] = "notVisited"
      })
      setQuestionStatuses(initialStatuses)
      setAnswers(new Array(filteredQuestions.length).fill(null))
    }
  }, [isExamStarted, filteredQuestions.length])

  const handleAnswer = (answerId: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = answerId
      return newAnswers
    })
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]:
        prev[currentQuestion] === "markedForReview"
          ? "markedForReview"
          : "answered",
    }))
  }

  const handleNavigate = (index: number) => {
    if (index < 0 || index >= filteredQuestions.length) return
    updateTimeSpent()
    setCurrentQuestion(index)
    setQuestionStatuses((prev) => {
      const status = prev[index]
      if (status === "notVisited") {
        return {
          ...prev,
          [index]: "notAnswered",
        }
      }
      return prev
    })
  }

  const handleReviewAndNext = () => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]: "markedForReview",
    }))
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1)
    }
  }

  const handleClear = () => {
    setAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = null
      return newAnswers
    })
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]:
        prev[currentQuestion] === "markedForReview"
          ? "markedForReview"
          : "notAnswered",
    }))
  }

  const handleNext = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      updateTimeSpent()
      handleNavigate(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      updateTimeSpent()
      handleNavigate(currentQuestion - 1)
    }
  }

  const handleSaveAndNext = () => {
    handleNext()
  }

  const calculateStatusCounts = () => {
    const counts: {
      notVisited: number
      notAnswered: number
      answered: number
      markedForReview: number
    } = {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
    }
  
    Object.values(questionStatuses).forEach((status) => {
      if (
        status === "notVisited" ||
        status === "notAnswered" ||
        status === "answered" ||
        status === "markedForReview"
      ) {
        counts[status] += 1
      }
    })
  
    return counts
  }
  

  const questionStatusCounts = calculateStatusCounts()

  const handleSubmit = useCallback(() => {
    if (!filteredQuestions.length) return

    const totalQuestions = filteredQuestions.length
    const correctCount = filteredQuestions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correctOption ? 1 : 0)
    }, 0)
    const incorrectAnswers = totalQuestions - correctCount
    const score = (correctCount / totalQuestions) * 100

    const topicPerformance: Record<string, TopicPerformance> = {}
    const subtopicPerformance: Record<string, TopicPerformance> = {}
    const topicWiseIncorrectAnswers: Record<string, number> = {}

    filteredQuestions.forEach((question, index) => {
      const isCorrect = answers[index] === question.correctOption

      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = { correct: 0, total: 0 }
      }
      topicPerformance[question.topic].total++
      if (isCorrect) {
        topicPerformance[question.topic].correct++
      } else {
        topicWiseIncorrectAnswers[question.topic] =
          (topicWiseIncorrectAnswers[question.topic] || 0) + 1
      }

      if (!subtopicPerformance[question.subtopic]) {
        subtopicPerformance[question.subtopic] = { correct: 0, total: 0 }
      }
      subtopicPerformance[question.subtopic].total++
      if (isCorrect) subtopicPerformance[question.subtopic].correct++
    })

    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3)

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / a[1].total)
      .slice(0, 3)

    const averageTimePerQuestion =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) /
      timeSpentPerQuestion.length

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
      userAnswers: answers.map((answer) => answer || ""),
      correctAnswers: filteredQuestions.map((q) => q.correctOption),
      timeSpentPerQuestion,
      averageTimePerQuestion,
      topicWiseIncorrectAnswers,
      questions: filteredQuestions,
      skillLevels,
    })

    setIsExamFinished(true)
  }, [answers, filteredQuestions, timeSpentPerQuestion])

  const updateTimeSpent = useCallback(() => {
    const timeSpent = Math.floor(
      (Date.now() - questionStartTimeRef.current) / 1000
    )
    setTimeSpentPerQuestion((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestion] =
        (newTimeSpent[currentQuestion] || 0) + timeSpent
      return newTimeSpent
    })
    questionStartTimeRef.current = Date.now()
  }, [currentQuestion])

  useEffect(() => {
    let examTimer: NodeJS.Timeout
    if (isExamStarted && !isExamFinished) {
      examTimer = setInterval(() => {
        setExamTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(examTimer)
            updateTimeSpent()
            handleSubmit()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    }
    return () => {
      if (examTimer) clearInterval(examTimer)
    }
  }, [isExamStarted, isExamFinished, updateTimeSpent, handleSubmit])

  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      updateTimeSpent()
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestion, isExamStarted, isExamFinished, updateTimeSpent])

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
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

  useEffect(() => {
    if (allQuestions.length > 0) {
      const uniqueExams = [...new Set(allQuestions.map((q) => q.exam))]
      setExams(uniqueExams)
    }
  }, [allQuestions])

  useEffect(() => {
    if (selectedExam) {
      const uniqueSubjects = [
        ...new Set(
          allQuestions
            .filter((q) => q.exam === selectedExam)
            .map((q) => q.subject)
        ),
      ]
      setSubjects(uniqueSubjects)
      setSelectedSubject("")
      setSelectedYear("")
    }
  }, [selectedExam, allQuestions])

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      const uniqueYears = [
        ...new Set(
          allQuestions
            .filter(
              (q) => q.exam === selectedExam && q.subject === selectedSubject
            )
            .map((q) => q.year)
        ),
      ]
      setYears(uniqueYears)
      setSelectedYear("")
    }
  }, [selectedExam, selectedSubject, allQuestions])

  const startExam = useCallback(() => {
    setExamTimeLeft(examMode === "past" ? HOUR_IN_SECONDS : examTime * 60)
    setIsExamStarted(true)
    setCurrentQuestion(0)
    setAnswers(new Array(filteredQuestions.length).fill(null))
    setQuestionStatuses({})
    setExamResults(null)
    setTimeSpentPerQuestion(new Array(filteredQuestions.length).fill(0))
    questionStartTimeRef.current = Date.now()
  }, [examMode, examTime, filteredQuestions.length])

  const exitExam = () => {
    if (
      window.confirm(
        "Are you sure you want to exit the exam? Your progress will be lost."
      )
    ) {
      setIsExamStarted(false)
      setIsExamFinished(false)
      setExamResults(null)
      router.push("/mock-exam") // Redirect to home page
    }
  }

  useEffect(() => {
    if (isExamStarted) {
      document.body.classList.add("exam-mode")
    } else {
      document.body.classList.remove("exam-mode")
    }
    return () => {
      document.body.classList.remove("exam-mode")
    }
  }, [isExamStarted])

  const renderExamSetup = () => (
    <ExamSetup
      exams={exams}
      subjects={subjects}
      years={years}
      selectedExam={selectedExam}
      selectedSubject={selectedSubject}
      selectedYear={selectedYear}
      selectedLevel={selectedLevel}
      numberOfQuestions={numberOfQuestions}
      skipCompleted={skipCompleted}
      examTime={examTime}
      examMode={examMode}
      onExamModeChange={setExamMode}
      onExamChange={setSelectedExam}
      onSubjectChange={setSelectedSubject}
      onYearChange={setSelectedYear}
      onLevelChange={setSelectedLevel}
      onNumberOfQuestionsChange={setNumberOfQuestions}
      onSkipCompletedChange={setSkipCompleted}
      onExamTimeChange={setExamTime}
      onStartExam={startExam}
    />
  )

  const renderExam = useCallback(
    () => (
      <Exam
        currentQuestion={currentQuestion}
        filteredQuestions={filteredQuestions}
        answers={answers}
        questionStatuses={questionStatuses}
        questionStatusCounts={questionStatusCounts}
        examTimeLeft={examTimeLeft}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClear={handleClear}
        onReviewAndNext={handleReviewAndNext}
        onSaveAndNext={handleSaveAndNext}
        onSubmit={() => {
          if (window.confirm("Are you sure you want to submit the exam?")) {
            updateTimeSpent()
            handleSubmit()
          }
        }}
        onExit={exitExam}
        onNavigate={handleNavigate}
        userName={session?.user?.name || "Guest User"}
        selectedSubject={selectedSubject}
        selectedYear={selectedYear}
        selectedLevel={selectedLevel}
      />
    ),
    [
      currentQuestion,
      filteredQuestions,
      answers,
      questionStatuses,
      questionStatusCounts,
      examTimeLeft,
      handleAnswer,
      handleNext,
      handlePrevious,
      handleClear,
      handleReviewAndNext,
      handleSaveAndNext,
      handleSubmit,
      exitExam,
      handleNavigate,
      session?.user?.name,
      selectedSubject,
      selectedYear,
      selectedLevel,
      updateTimeSpent,
    ]
  )

  const onStartNewExam = () => {
    setIsExamStarted(false)
    setIsExamFinished(false)
    setExamResults(null)
  }

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
      {!isExamStarted && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={darkMode ? "dark" : ""}
        >
          {renderExamSetup()}
        </motion.div>
      )}
      {isExamStarted && !isExamFinished && (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`${darkMode ? "dark" : ""} fixed inset-0 z-50`}
        >
          {renderExam()}
        </motion.div>
      )}
      {isExamFinished && examResults && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={darkMode ? "dark" : ""}
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

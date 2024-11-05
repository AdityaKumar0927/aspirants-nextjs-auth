"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { User, Clock, AlertCircle, CheckCircle, Flag, ChevronLeft, ChevronRight, Zap, X, Pencil, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MathRenderer from "@/components/layout/MathRenderer"
import Image from "next/image"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface QuestionType {
  id: string
  text: string
  options: { [key: string]: string }
  correctOption: string
  exam: string
  subject: string
  year: string
  topic: string
  subtopic: string
  diagramUrl?: string
  type: "Multiple Choice" | "Numerical"
  markscheme?: string
}

interface ExamResultsType {
  totalQuestions: number
  correctAnswersCount: number
  incorrectAnswers: number
  score: number
  topicPerformance: Record<string, { correct: number; total: number }>
  subtopicPerformance: Record<string, { correct: number; total: number }>
  topStrengths: [string, { correct: number; total: number }][]
  topWeaknesses: [string, { correct: number; total: number }][]
  userAnswers: string[]
  correctAnswers: string[]
  timeSpentPerQuestion: number[]
  averageTimePerQuestion: number
  topicWiseIncorrectAnswers: Record<string, number>
}

const HOUR_IN_SECONDS = 3600

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const renderExamResults = (examResults: ExamResultsType, filteredQuestions: QuestionType[]) => {
  if (!examResults) return null

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-purple-800 dark:text-purple-200">
            Exam Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Questions:</span>
                <span className="text-2xl font-bold">{examResults.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Correct Answers:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {examResults.correctAnswersCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Incorrect Answers:</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {examResults.incorrectAnswers}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Score:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {examResults.score.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Average Time per Question:</span>
                <span className="text-2xl font-bold">
                  {formatTime(Math.round(examResults.averageTimePerQuestion))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <PieChart className="w-6 h-6 mr-2 text-blue-500" />
            Topic Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {Object.entries(examResults.topicPerformance).map(([topic, performance]) => (
              <div key={topic} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{topic}:</span>
                  <span className="font-bold">
                    {((performance.correct / performance.total) * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress
                  value={(performance.correct / performance.total) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
            Answer Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="py-2 px-4 text-left">Question</th>
                  <th className="py-2 px-4 text-left">Your Answer</th>
                  <th className="py-2 px-4 text-left">Correct Answer</th>
                  <th className="py-2 px-4 text-left">Time Spent</th>
                  <th className="py-2 px-4 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question, index) => (
                  <tr key={question.id} className="border-b last:border-b-0">
                    <td className="py-3 px-4">
                      <span className="font-medium">Q{index + 1}:</span> {question.text}
                    </td>
                    <td className="py-3 px-4">
                      {examResults.userAnswers[index] || "Not answered"}
                    </td>
                    <td className="py-3 px-4">{question.correctOption}</td>
                    <td className="py-3 px-4">{formatTime(examResults.timeSpentPerQuestion[index])}</td>
                    <td className="py-3 px-4">
                      {examResults.userAnswers[index] === question.correctOption ? (
                        <span className="text-green-600 font-medium">Correct</span>
                      ) : (
                        <span className="text-red-600 font-medium">Incorrect</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-green-500" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {examResults.topStrengths.map(([topic, performance]) => (
                <li key={topic} className="flex justify-between items-center">
                  <span>{topic}:</span>
                  <span className="font-bold text-green-600">
                    {((performance.correct / performance.total) * 100).toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-yellow-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {examResults.topWeaknesses.map(([topic, performance]) => (
                <li key={topic} className="flex justify-between items-center">
                  <span>{topic}:</span>
                  <span className="font-bold text-yellow-600">
                    {((performance.correct / performance.total) * 100).toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
            Topics with Most Incorrect Answers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {Object.entries(examResults.topicWiseIncorrectAnswers)
              .sort((a, b) => b[1] - a[1])
              .map(([topic, count]) => (
                <div key={topic} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{topic}:</span>
                    <span className="font-bold text-red-600">{count} incorrect</span>
                  </div>
                  <Progress
                    value={(count / examResults.totalQuestions) * 100}
                    className="h-2"
                  />
                </div>
              ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Component() {
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set())
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
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | undefined>(undefined)
  const { data: session } = useSession()
  const { toast } = useToast()
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])

  const handleSubmit = useCallback(() => {
    if (!filteredQuestions.length) return

    const totalQuestions = filteredQuestions.length
    const correctCount = filteredQuestions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correctOption ? 1 : 0)
    }, 0)
    const incorrectAnswers = totalQuestions - correctCount
    const score = (correctCount / totalQuestions) * 100

    const topicPerformance: Record<string, { correct: number; total: number }> = {}
    const subtopicPerformance: Record<string, { correct: number; total: number }> = {}
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
        topicWiseIncorrectAnswers[question.topic] = (topicWiseIncorrectAnswers[question.topic] || 0) + 1
      }

      if (!subtopicPerformance[question.subtopic]) {
        subtopicPerformance[question.subtopic] = { correct: 0, total: 0 }
      }
      
      subtopicPerformance[question.subtopic].total++
      if (isCorrect) subtopicPerformance[question.subtopic].correct++
    })

    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
      .slice(0, 3)

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 3)

    const averageTimePerQuestion = timeSpentPerQuestion.reduce((a, b) => a + b, 0) / timeSpentPerQuestion.length

    setExamResults({
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswers,
      score,
      topicPerformance,
      subtopicPerformance,
      topStrengths,
      topWeaknesses,
      userAnswers: answers,
      correctAnswers: filteredQuestions.map((q) => q.correctOption),
      timeSpentPerQuestion,
      averageTimePerQuestion,
      topicWiseIncorrectAnswers,
    })

    setIsExamFinished(true)
  }, [answers, filteredQuestions, timeSpentPerQuestion])

  const updateTimeSpent = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    setTimeSpentPerQuestion((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestion] = (newTimeSpent[currentQuestion] || 0) + timeSpent
      return newTimeSpent
    })
    setQuestionStartTime(Date.now())
  }, [currentQuestion, questionStartTime])

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
  }, [isExamStarted, isExamFinished, handleSubmit, updateTimeSpent])

  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      updateTimeSpent()
      setQuestionStartTime(Date.now())
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
              (q) =>
                q.exam === selectedExam &&
                q.subject === selectedSubject
            )
            .map((q) => q.year)
        ),
      ]
      setYears(uniqueYears)
      setSelectedYear("")
    }
  }, [selectedExam, selectedSubject, allQuestions])

  useEffect(() => {
    const currentQuestionId = filteredQuestions[currentQuestion]?.id
    if (currentQuestionId) {
      setVisitedQuestions((prev) => new Set(prev).add(currentQuestionId))
    }
  }, [currentQuestion, filteredQuestions])

  const startExam = () => {
    let filtered: QuestionType[]
    if (examMode === "past") {
      filtered = allQuestions.filter(
        (q) =>
          q.exam === selectedExam &&
          q.subject === selectedSubject &&
          q.year === selectedYear
      )
      setExamTimeLeft(HOUR_IN_SECONDS) // 1 hour for past papers
    } else {
      filtered = allQuestions
        .filter(
          (q) =>
            q.exam === selectedExam &&
            q.subject === selectedSubject &&
            q.year === selectedYear
        )
        .slice(0, numberOfQuestions)
      setExamTimeLeft(examTime * 60) // Convert minutes to seconds
    }
    setFilteredQuestions(filtered)
    setIsExamStarted(true)
    setCurrentQuestion(0)
    setAnswers(new Array(filtered.length).fill(""))
    setMarkedForReview(new Set())
    setVisitedQuestions(new Set())
    setExamResults(null)
    setTimeSpentPerQuestion(new Array(filtered.length).fill(0))
    setQuestionStartTime(Date.now())
  }

  const handleAnswer = (answerId: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = answerId
      return newAnswers
    })
  }

  const handleNext = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      updateTimeSpent()
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      updateTimeSpent()
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleClear = () => {
    setAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = ""
      return newAnswers
    })
    setFeedback(undefined)
  }

  const handleReviewAndNext = () => {
    const currentQuestionId = filteredQuestions[currentQuestion]?.id
    if (currentQuestionId) {
      setMarkedForReview((prev) => new Set(prev).add(currentQuestionId))
    }
    handleNext()
  }

  const handleSaveAndNext = () => {
    handleNext()
  }

  const questionStatus = useMemo(() => {
    const total = filteredQuestions.length
    const visited = visitedQuestions.size
    const answeredCount = answers.filter(Boolean).length
    const notAnswered = visited - answeredCount
    const notVisited = total - visited
    return {
      notVisited,
      notAnswered,
      answered: answeredCount,
      markedForReview: markedForReview.size,
    }
  }, [filteredQuestions.length, answers, markedForReview, visitedQuestions])

  const renderQuestionDiagram = (diagramUrl: string | undefined) => {
    if (!diagramUrl) return null

    return (
      <div className="relative w-full h-64 mb-4">
        <Image
          src={diagramUrl}
          alt="Question diagram"
          fill
          style={{ objectFit: "contain" }}
          className="rounded-md"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-3/4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-500 dark:text-blue-300" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Mock Exam</h1>
          </div>

          <Tabs value={examMode} onValueChange={(value) => setExamMode(value as "past" | "custom")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="past" className="text-lg">Past Papers</TabsTrigger>
              <TabsTrigger value="custom" className="text-lg">Custom Mock Exam</TabsTrigger>
            </TabsList>
            <TabsContent value="past">
              <div className="grid gap-6">
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="custom">
              <div className="grid gap-6">
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4">
                  <label className="text-lg font-medium">Questions:</label>
                  <Input
                    type="number"
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                    className="w-32 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 h-14 text-lg"
                    min={1}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="skip"
                    checked={skipCompleted}
                    onCheckedChange={(checked) => setSkipCompleted(checked as boolean)}
                    className="w-5 h-5 border-2 border-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <label html-for="skip" className="text-lg font-medium">
                    Skip completed questions
                  </label>
                </div>
                <div>
                  <label className="text-lg font-medium mb-2 block">Exam Time (minutes)</label>
                  <Slider
                    value={[examTime]}
                    onValueChange={(value) => setExamTime(value[0])}
                    max={120}
                    min={15}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-center mt-2 text-lg">{examTime} minutes</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Pencil className="w-6 h-6 text-blue-500 dark:text-blue-300" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Exam mode</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Instructions</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300 list-disc pl-5">
                  <li>The mock exam will start as soon as you click the "Start Exam" button.</li>
                  <li>Show all working whenever possible.</li>
                  <li>Use fully labelled diagrams and references to the text/data where appropriate.</li>
                  <li>Your score and feedback will be compiled into a report at the end of the exam.</li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={startExam}
                disabled={!selectedExam || !selectedSubject || !selectedYear || (examMode === "custom" && !selectedLevel)}
                className="w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Start Exam
                <Zap className="ml-2 h-5 w-5" />
                <span className="ml-1">{examMode === "past" ? "Full Paper" : numberOfQuestions}</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQuestionData = filteredQuestions[currentQuestion]

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-lg font-semibold">
              No questions available for the selected criteria.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExamFinished && examResults) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 overflow-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Exam Results</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">{selectedSubject} ({selectedYear}) - {selectedLevel}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{examResults.score.toFixed(2)}%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {examResults.correctAnswersCount} out of {examResults.totalQuestions} correct
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(Math.round(examResults.averageTimePerQuestion * examResults.totalQuestions))}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg. {formatTime(Math.round(examResults.averageTimePerQuestion))} per question
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{examResults.correctAnswersCount}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((examResults.correctAnswersCount / examResults.totalQuestions) * 100).toFixed(2)}% accuracy
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect Answers</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{examResults.incorrectAnswers}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((examResults.incorrectAnswers / examResults.totalQuestions) * 100).toFixed(2)}% incorrect
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                performance: {
                  label: "Performance",
                  color: "hsl(var(--chart-1))",
                },
              }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(examResults.topicPerformance).map(([topic, performance]) => ({
                    topic,
                    performance: (performance.correct / performance.total) * 100
                  }))}>
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="performance" fill="var(--color-performance)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                time: {
                  label: "Time Spent",
                  color: "hsl(var(--chart-2))",
                },
              }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={examResults.timeSpentPerQuestion.map((time, index) => ({
                        name: `Q${index + 1}`,
                        value: time
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="var(--color-time)"
                      dataKey="value"
                    >
                      {examResults.timeSpentPerQuestion.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 30}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Your Answer</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">Q{index + 1}</TableCell>
                    <TableCell>{examResults.userAnswers[index] || "Not answered"}</TableCell>
                    <TableCell>{question.correctOption}</TableCell>
                    <TableCell>{formatTime(examResults.timeSpentPerQuestion[index])}</TableCell>
                    <TableCell>
                      {examResults.userAnswers[index] === question.correctOption ? (
                        <span className="text-green-600 font-medium flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Correct
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Incorrect
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Top Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {examResults.topStrengths.map(([topic, performance]) => (
                  <li key={topic} className="flex justify-between items-center">
                    <span>{topic}</span>
                    <span className="font-bold text-green-600">
                      {((performance.correct / performance.total) * 100).toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {examResults.topWeaknesses.map(([topic, performance]) => (
                  <li key={topic} className="flex justify-between items-center">
                    <span>{topic}</span>
                    <span className="font-bold text-yellow-600">
                      {((performance.correct / performance.total) * 100).toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => {
            setIsExamStarted(false)
            setIsExamFinished(false)
            setAnswers([])
            setMarkedForReview(new Set())
            setCurrentQuestion(0)
            setExamTimeLeft(examMode === "past" ? HOUR_IN_SECONDS : examTime * 60)
            setExamResults(null)
            setVisitedQuestions(new Set())
            setTimeSpentPerQuestion([])
          }}
          className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Start New Exam
        </Button>
      </motion.div>
    </div>
  )
}

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-500 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-sm font-medium  text-gray-900 dark:text-gray-100">
                  {session?.user?.name || "Guest User"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedSubject} ({selectedYear}) - {selectedLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(examTimeLeft)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex overflow-hidden">
        <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-900 dark:text-gray-100">
                  <span>Question {currentQuestion + 1}</span>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {currentQuestion + 1} of {filteredQuestions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {renderQuestionDiagram(currentQuestionData.diagramUrl)}
                <div className="text-gray-800 dark:text-gray-200 mb-6 text-lg sm:text-xl md:text-2xl leading-relaxed">
                  <MathRenderer text={currentQuestionData.text} />
                </div>
                {currentQuestionData.type === "Multiple Choice" && (
                  <div className="space-y-4 mt-6">
                    {Object.entries(currentQuestionData.options).map(([optionId, optionText], index) => (
                      <Button
                        key={`${currentQuestionData.id}_${optionId}`}
                        variant={answers[currentQuestion] === String.fromCharCode(65 + index) ? "secondary" : "outline"}
                        className={`w-full justify-start text-left h-auto py-4 px-6 text-lg transition-all duration-200 ${
                          answers[currentQuestion] === String.fromCharCode(65 + index)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => handleAnswer(String.fromCharCode(65 + index))}
                      >
                        <span className="font-semibold mr-4">{String.fromCharCode(65 + index)}.</span>
                        <MathRenderer text={optionText} />
                      </Button>
                    ))}
                  </div>
                )}
                {currentQuestionData.type === "Numerical" && (
                  <div className="mt-6">
                    <Input
                      type="text"
                      className="w-full p-4 text-lg sm:text-xl bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      placeholder="Enter your numerical answer..."
                      value={answers[currentQuestion] || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-4 justify-between">
                <div className="flex gap-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === filteredQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleClear} variant="outline">
                    Clear
                  </Button>
                  <Button onClick={handleReviewAndNext} variant="outline">
                    Review & Next
                  </Button>
                  <Button onClick={handleSaveAndNext} variant="secondary">
                    Save & Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        <Separator orientation="vertical" className="h-auto" />

        <div className="w-80 bg-white dark:bg-gray-800 overflow-auto p-4 space-y-6">
          <Card className="bg-gray-50 dark:bg-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Question Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
                    Not Visited
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{questionStatus.notVisited}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    Not Answered
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{questionStatus.notAnswered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Answered
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{questionStatus.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Flag className="w-4 h-4 mr-2 text-blue-500" />
                    Marked for Review
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{questionStatus.markedForReview}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, index) => {
                  const questionId = filteredQuestions[index]?.id
                  const isAnswered = questionId ? !!answers[index] : false
                  const isMarkedForReview = questionId ? markedForReview.has(questionId) : false
                  const isCurrent = index === currentQuestion
                  let buttonVariant: "default" | "outline" | "secondary" = "outline"
                  if (isMarkedForReview) {
                    buttonVariant = "secondary"
                  } else if (isAnswered) {
                    buttonVariant = "default"
                  }
                  return (
                    <Button
                      key={index}
                      variant={buttonVariant}
                      className={`h-10 w-10 p-0 text-sm font-medium ${
                        isCurrent ? "ring-2 ring-blue-500" : ""
                      } ${
                        isAnswered
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          : isMarkedForReview
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            Submit Exam
          </Button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <Progress
          value={(examTimeLeft / (examMode === "past" ? HOUR_IN_SECONDS : examTime * 60)) * 100}
          className="h-full bg-blue-500"
        />
      </div>

      <AnimatePresence>
        {showMarkschemeModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
          >
            <Card className="w-full max-w-2xl bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Markscheme</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4"
                        onClick={() => setShowMarkschemeModal(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close markscheme</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="p-4 text-gray-800 dark:text-gray-200">
                    {currentQuestionData.markscheme ? (
                      <MathRenderer text={currentQuestionData.markscheme} />
                    ) : (
                      "No answer available"
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
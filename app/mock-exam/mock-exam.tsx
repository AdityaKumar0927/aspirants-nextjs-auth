"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { User, Clock, AlertCircle, CheckCircle, Flag, ChevronLeft, ChevronRight, BarChart, PieChart, Zap, X, Pencil, LogOut } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
  questions: QuestionType[]
}

const HOUR_IN_SECONDS = 3600

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function ExamResults({ examResults, onStartNewExam }: { examResults: ExamResultsType; onStartNewExam: () => void }) {
  const renderSummaryCard = useMemo(() => (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-lg font-medium tracking-tight">Exam Performance Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-tight">Total Questions: <span className="font-bold">{examResults.totalQuestions}</span></p>
          <p className="text-sm font-medium tracking-tight">Correct Answers: <span className="font-bold text-green-600">{examResults.correctAnswersCount}</span></p>
          <p className="text-sm font-medium tracking-tight">Incorrect Answers: <span className="font-bold text-red-600">{examResults.incorrectAnswers}</span></p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-tight">Score: <span className="font-bold text-blue-600">{examResults.score.toFixed(2)}%</span></p>
          <p className="text-sm font-medium tracking-tight">Average Time per Question: <span className="font-bold">{formatTime(Math.round(examResults.averageTimePerQuestion))}</span></p>
        </div>
      </CardContent>
    </Card>
  ), [examResults])

  const renderTopicPerformance = useMemo(() => (
    <Card>
      <CardHeader className="bg-secondary text-secondary-foreground">
        <CardTitle className="flex items-center text-lg font-medium tracking-tight">
          <PieChart className="w-5 h-5 mr-2" />
          Topic Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {Object.entries(examResults.topicPerformance).map(([topic, performance]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium tracking-tight">{topic}</span>
                  <span className="font-bold tracking-tight">{((performance.correct / performance.total) * 100).toFixed(2)}%</span>
                </div>
                <Progress value={(performance.correct / performance.total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  ), [examResults])

  const renderAnswerReview = useMemo(() => (
    <Card>
      <CardHeader className="bg-accent text-accent-foreground">
        <CardTitle className="flex items-center text-lg font-medium tracking-tight">
          <CheckCircle className="w-5 h-5 mr-2" />
          Answer Review
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-[400px]">
          <table className="w-full">
            <thead>
              <tr className="text-left [&>th]:p-2 bg-muted">
                <th className="font-medium tracking-tight">Question</th>
                <th className="font-medium tracking-tight">Your Answer</th>
                <th className="font-medium tracking-tight">Correct Answer</th>
                <th className="font-medium tracking-tight">Time Spent</th>
                <th className="font-medium tracking-tight">Result</th>
              </tr>
            </thead>
            <tbody>
              {examResults.questions.map((question, index) => (
                <tr key={question.id} className="border-b last:border-b-0 [&>td]:p-2">
                  <td className="text-sm"><span className="font-medium tracking-tight">Q{index + 1}:</span> {question.text}</td>
                  <td className="text-sm font-medium tracking-tight">{examResults.userAnswers[index] || "Not answered"}</td>
                  <td className="text-sm font-medium tracking-tight">{question.correctOption}</td>
                  <td className="text-sm font-medium tracking-tight">{formatTime(examResults.timeSpentPerQuestion[index])}</td>
                  <td>
                    <span className={`text-sm font-bold tracking-tight ${examResults.userAnswers[index] === question.correctOption ? "text-green-600" : "text-red-600"}`}>
                      {examResults.userAnswers[index] === question.correctOption ? "Correct" : "Incorrect"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  ), [examResults])

  const renderStrengthsAndWeaknesses = useMemo(() => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="bg-green-100 dark:bg-green-900">
          <CardTitle className="flex items-center text-lg font-medium tracking-tight text-green-800 dark:text-green-100">
            <BarChart className="w-5 h-5 mr-2" />
            Top Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-2">
            {examResults.topStrengths.map(([topic, performance]) => (
              <li key={topic} className="flex justify-between items-center">
                <span className="text-sm font-medium tracking-tight">{topic}</span>
                <span className="text-sm font-bold tracking-tight text-green-600">
                  {((performance.correct / performance.total) * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="bg-yellow-100 dark:bg-yellow-900">
          <CardTitle className="flex items-center text-lg font-medium tracking-tight text-yellow-800 dark:text-yellow-100">
            <BarChart className="w-5 h-5 mr-2" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-2">
            {examResults.topWeaknesses.map(([topic, performance]) => (
              <li key={topic} className="flex justify-between items-center">
                <span className="text-sm font-medium tracking-tight">{topic}</span>
                <span className="text-sm font-bold tracking-tight text-yellow-600">
                  {((performance.correct / performance.total) * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  ), [examResults])

  const renderIncorrectAnswers = useMemo(() => (
    <Card>
      <CardHeader className="bg-red-100 dark:bg-red-900">
        <CardTitle className="flex items-center text-lg font-medium tracking-tight text-red-800 dark:text-red-100">
          <AlertCircle className="w-5 h-5 mr-2" />
          Topics with Most Incorrect Answers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-48">
          <div className="space-y-4">
            {Object.entries(examResults.topicWiseIncorrectAnswers)
              .sort((a, b) => b[1] - a[1])
              .map(([topic, count]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium tracking-tight">{topic}</span>
                    <span className="font-bold tracking-tight text-red-600">{count} incorrect</span>
                  </div>
                  <Progress value={(count / examResults.totalQuestions) * 100} className="h-2" />
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  ), [examResults])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 space-y-8"
    >
      <h1 className="text-3xl font-bold text-center mb-8 tracking-tight">Exam Results</h1>
      {renderSummaryCard}
      {renderTopicPerformance}
      {renderAnswerReview}
      {renderStrengthsAndWeaknesses}
      {renderIncorrectAnswers}
      <Button onClick={onStartNewExam} className="w-full mt-8 font-medium tracking-tight">
        Start New Exam
      </Button>
    </motion.div>
  )
}

export default function MockExam() {
  const router = useRouter()
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([])
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
  const { data: session } = useSession()
  const { toast } = useToast()
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null)
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const questionStartTimeRef = useRef<number>(0)
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([])
  const [darkMode, setDarkMode] = useState(false); // Added state for dark mode

  const filteredQuestions = useMemo(() => {
    if (examMode === "past") {
      return  allQuestions.filter(
        (q) =>
          q.exam === selectedExam &&
          q.subject === selectedSubject &&
          q.year === selectedYear
      )
    } else {
      return allQuestions
        .filter(
          (q) =>
            q.exam === selectedExam &&
            q.subject === selectedSubject &&
            q.year === selectedYear
        )
        .slice(0, numberOfQuestions)
    }
  }, [
    allQuestions,
    examMode,
    selectedExam,
    selectedSubject,
    selectedYear,
    numberOfQuestions,
  ])

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
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3)

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / a[1].total)
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
      questions: filteredQuestions,
    })

    setIsExamFinished(true)
  }, [answers, filteredQuestions, timeSpentPerQuestion])

  const updateTimeSpent = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    setTimeSpentPerQuestion((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestion] = (newTimeSpent[currentQuestion] || 0) + timeSpent
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
              (q) =>
                q.exam === selectedExam && q.subject === selectedSubject
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
    if (currentQuestionId && !visitedQuestions.has(currentQuestionId)) {
      setVisitedQuestions((prev) => new Set(prev).add(currentQuestionId))
    }
  }, [currentQuestion, filteredQuestions, visitedQuestions])

  const startExam = useCallback(() => {
    setExamTimeLeft(examMode === "past" ? HOUR_IN_SECONDS : examTime * 60)
    setIsExamStarted(true)
    setCurrentQuestion(0)
    setAnswers(new Array(filteredQuestions.length).fill(""))
    setMarkedForReview(new Set())
    setVisitedQuestions(new Set())
    setExamResults(null)
    setTimeSpentPerQuestion(new Array(filteredQuestions.length).fill(0))
    questionStartTimeRef.current = Date.now()
  }, [examMode, examTime, filteredQuestions.length])

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
  }, [filteredQuestions.length, visitedQuestions.size, answers, markedForReview.size])

  const exitExam = () => {
    if (window.confirm("Are you sure you want to exit the exam? Your progress will be lost.")) {
      setIsExamStarted(false)
      setIsExamFinished(false)
      setExamResults(null)
      router.push("/") // Redirect to home page
    }
  }

  useEffect(() => {
    if (isExamStarted) {
      document.body.classList.add('exam-mode')
    } else {
      document.body.classList.remove('exam-mode')
    }

    return () => {
      document.body.classList.remove('exam-mode')
    }
  }, [isExamStarted])

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

  const renderExamSetup = () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
          
          <h1 className="text-5xl font-light tracking-tight">Mock Exam</h1>
        </div>

        <Tabs
          value={examMode}
          onValueChange={(value) => setExamMode(value as "past" | "custom")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="past">Past Papers</TabsTrigger>
            <TabsTrigger value="custom">Custom Mock Exam</TabsTrigger>
          </TabsList>
          <TabsContent value="past">
            <div className="grid gap-4">
              <div>
                <label className="text-xl font-semibold">Exam</label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom">
            <div className="grid gap-4">
              <div>
                <label className="text-xl font-semibold">Exam</label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Questions</label>
                <Input
                  type="number"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                  className="w-32 bg-gray-50 border-gray-200 h-14 text-lg"
                  min={1}
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <Checkbox
                  id="skip"
                  checked={skipCompleted}
                  onCheckedChange={(checked) => setSkipCompleted(checked as boolean)}
                  className="w-5 h-5 border-2 border-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                />
                <label htmlFor="skip" className="text-lg font-medium">
                  Skip completed questions
                </label>
              </div>
              <div>
                <label className="text-xl font-semibold">Exam Time (minutes)</label>
                <Slider
                  value={[examTime]}
                  onValueChange={(value) => setExamTime(value[0])}
                  max={120}
                  min={15}
                  step={5}
                  className="w-full"
                />
                <div className="text-center mt-2">{examTime} minutes</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-6 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Pencil className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-4xl font-light">Exam mode</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-light mb-4">Instructions</h3>
              <ul className="space-y-3 text-gray-600">
                <li>The mock exam will start as soon as you click the "Start Exam" button.</li>
                <li>Show all working whenever possible.</li>
                <li>Use fully labelled diagrams and references to the text/data where appropriate.</li>
                <li>Your score and feedback will be compiled into a report at the end of the exam.</li>
              </ul>
            </div>

            <Button
              size="lg"
              onClick={startExam}
              disabled={
                !selectedExam ||
                !selectedSubject ||
                !selectedYear ||
                (examMode === "custom" && !selectedLevel)
              }
              className="w-auto bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600 hover:border-purple-700 hover:text-purple-700"
            >
              Start Exam
              <Zap className="ml-2 h-4 w-4" />
              <span className="ml-1">{examMode === "past" ? "Full Paper" : numberOfQuestions}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderExam = useCallback(() => {
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

    return (
      <div className="min-h-screen w-full bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-medium">{session?.user?.name || "Guest User"}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubject} ({selectedYear}) - {selectedLevel}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(examTimeLeft)}
                </div>
                <Button variant="ghost" size="icon" onClick={exitExam}>
                  <LogOut className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow flex overflow-hidden">
          <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
            <Card className="mb-6 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Question {currentQuestion + 1}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {currentQuestion + 1} of {filteredQuestions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {renderQuestionDiagram(currentQuestionData.diagramUrl)}
                <div
                  className="text-gray-700 mb-4 text-base sm:text-lg md:text-xl leading-7"
                  dangerouslySetInnerHTML={{ __html: currentQuestionData.text }}
                />
                {currentQuestionData.type === "Multiple Choice" && (
                  <div className="space-y-4 mt-4">
                    {Object.entries(currentQuestionData.options).map(([optionId, optionText], index) => (
                      <Button
                        key={`${currentQuestionData.id}_${optionId}`}
                        variant={answers[currentQuestion] === String.fromCharCode(65 + index) ? "secondary" : "outline"}
                        className={`w-full justify-start text-left h-auto py-3 px-4`}
                        onClick={() => handleAnswer(String.fromCharCode(65 + index))}
                      >
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                        <span dangerouslySetInnerHTML={{ __html: optionText.replace(/"/g, '&quot;') }} />
                      </Button>
                    ))}
                  </div>
                )}
                {currentQuestionData.type === "Numerical" && (
                  <div className="mt-4">
                    <Input
                      type="text"
                      className="w-full p-2 text-base sm:text-lg"
                      placeholder="Write your answer here..."
                      value={answers[currentQuestion] || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-3 justify-between">
                <div className="flex gap-3">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === filteredQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleClear} variant="outline">
                    Clear
                  </Button>
                  <Button onClick={handleReviewAndNext} variant="outline">
                    Review & Next
                  </Button>
                  <Button onClick={handleSaveAndNext} variant="outline">
                    Save & Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <Separator orientation="vertical" className="h-auto" />

          <div className="w-80 bg-background overflow-auto p-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Question Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                      Not Visited
                    </span>
                    <span className="font-medium">{questionStatus.notVisited}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                      Not Answered
                    </span>
                    <span className="font-medium">{questionStatus.notAnswered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Answered
                    </span>
                    <span className="font-medium">{questionStatus.answered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <Flag className="w-4 h-4 mr-2 text-blue-500" />
                      Marked for Review
                    </span>
                    <span className="font-medium">{questionStatus.markedForReview}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {filteredQuestions.map((_, index) => {
                    const questionId = filteredQuestions[index].id
                    const isAnswered = !!answers[index]
                    const isMarkedForReview = markedForReview.has(questionId)
                    const isVisited = visitedQuestions.has(questionId)
                    const isCurrentQuestion = currentQuestion === index

                    let buttonClasses = "w-10 h-10 p-0 font-medium"

                    if (isCurrentQuestion) {
                      buttonClasses += " border-blue-800 bg-blue-100 text-blue-600"
                    } else if (isMarkedForReview) {
                      buttonClasses += " border-yellow-600 bg-yellow-100 text-yellow-600"
                    } else if (isVisited && !isAnswered) {
                      buttonClasses += " border-gray-600 bg-gray-100 text-gray-600"
                    } else if (isAnswered) {
                      buttonClasses += " border-green-600 bg-green-100 text-green-600"
                    } else {
                      buttonClasses += " border-gray-300 bg-white text-gray-600"
                    }

                    return (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className={buttonClasses}
                              onClick={() => {
                                updateTimeSpent()
                                setCurrentQuestion(index)
                              }}
                            >
                              {index + 1}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {isAnswered
                                ? "Answered"
                                : isMarkedForReview
                                ? "Marked for Review"
                                : isVisited
                                ? "Visited"
                                : "Not Visited"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full">
              Submit Exam
            </Button>
          </div>
        </main>
      </div>
    )
  }, [
    currentQuestion,
    filteredQuestions,
    answers,
    markedForReview,
    visitedQuestions,
    examTimeLeft,
    handleSubmit,
    updateTimeSpent,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleClear,
    handleReviewAndNext,
    handleSaveAndNext,
    session,
    selectedSubject,
    selectedYear,
    selectedLevel,
    exitExam,
    questionStatus,
    renderQuestionDiagram,
  ])

  const onStartNewExam = () => {
    setIsExamStarted(false)
    setIsExamFinished(false)
    setExamResults(null)
  }

  const renderExamResults = useMemo(() => {
    if (!examResults) return null

    return (
      <ExamResults examResults={examResults} onStartNewExam={() => {
        setIsExamStarted(false)
        setIsExamFinished(false)
        setExamResults(null)
      }} />
    )
  }, [examResults])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
            </div>
            <div className="flex justify-center">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
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
          className={darkMode ? 'dark' : ''}
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
          className={`${darkMode ? 'dark' : ''} fixed inset-0 z-50`}
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
          className={darkMode ? 'dark' : ''}
        >
          {renderExamResults}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
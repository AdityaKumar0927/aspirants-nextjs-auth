"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import html2pdf from "html2pdf.js"
import "chart.js/auto"

import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle,
  Download,
  PieChart,
  TrendingUp,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { Pie, Bar } from "react-chartjs-2"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionTrigger,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"

import MathRenderer from "@/components/layout/MathRenderer"
import {
  displayCorrectAnswer,
  displayUserAnswer,
  gradeAnswer,
  parseMultiAnswer,
  type ExamResultsType,
  type QuestionType,
} from "@/lib/exam-helpers"

/** Correct option letters for a choice question. */
function correctLetters(q: QuestionType): Set<string> {
  return new Set([q.correctOption, ...q.correctOptions].filter(Boolean))
}

/** Helper: format seconds into mm:ss */
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/** 
 * Renders small "meta tags" for a question: subject, difficulty, year, type, exam.
 * Similar to how Question.tsx does it, but read-only. 
 */
function renderQuestionMeta(q: QuestionType) {
  const badges: React.ReactNode[] = []

  if (q.subject) {
    badges.push(
      <span
        key="subject"
        className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
      >
        {q.subject}
      </span>
    )
  }
  if (q.difficulty) {
    badges.push(
      <span
        key="difficulty"
        className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
      >
        {q.difficulty}
      </span>
    )
  }
  if (typeof q.year === "number") {
    badges.push(
      <span
        key="year"
        className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
      >
        {q.year}
      </span>
    )
  }
  if (q.type) {
    badges.push(
      <span
        key="type"
        className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
      >
        {q.type}
      </span>
    )
  }
  if (q.exam) {
    badges.push(
      <span
        key="exam"
        className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
      >
        {q.exam}
      </span>
    )
  }

  if (!badges.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((b) => b)}
    </div>
  )
}

/** Renders a question diagram if present. */
function renderDiagram(diagramUrl?: string) {
  if (!diagramUrl) return null
  return (
    <div className="relative w-full max-w-xl mx-auto mb-4">
      <img
        src={diagramUrl}
        alt="Diagram"
        className="rounded-md w-full h-auto object-contain"
      />
    </div>
  )
}

/**
 * Returns a "read-only" display of the question’s options, highlighting
 * correct vs. user’s incorrect choice for MCQ. 
 */
function renderOptions(q: QuestionType, userAnswer: string | null) {
  if (!q.options) return null

  const correct = correctLetters(q)
  const userLetters =
    q.type === "Multiple Correct"
      ? parseMultiAnswer(userAnswer)
      : userAnswer
      ? [userAnswer]
      : []

  return (
    <div className="space-y-2 mt-4">
      {Object.entries(q.options).map(([optionKey, optionText]) => {
        // Was this a correct option?
        const isCorrectOption = correct.has(optionKey)
        // Did user choose this?
        const isUserOption = userLetters.includes(optionKey)

        // Decide color
        // If user got it right => highlight that single one in green
        // If user got it wrong => highlight correct in green, user’s in red
        // If user didn’t answer => only highlight correct in green
        let extraClass = "border-gray-300 hover:bg-gray-50"
        if (userAnswer === null && isCorrectOption) {
          extraClass = "border-green-400 bg-green-50 text-green-800"
        } else if (isCorrectOption && isUserOption) {
          // user answered & was correct
          extraClass = "border-green-400 bg-green-50 text-green-800"
        } else if (isCorrectOption) {
          extraClass = "border-green-300 bg-green-50 text-green-700"
        } else if (isUserOption && !isCorrectOption) {
          extraClass = "border-red-300 bg-red-50 text-red-700"
        }

        return (
          <div
            key={optionKey}
            className={`
              text-left border rounded p-3 transition-colors 
              bg-white
              ${extraClass}
            `}
          >
            <strong className="mr-2">{optionKey}.</strong>
            {optionText.startsWith("http") ? (
              <img
                src={optionText}
                alt={`Option ${optionKey}`}
                className="rounded-md w-full h-auto object-contain mt-2"
              />
            ) : (
              <MathRenderer text={optionText} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders the question detail (diagram, text, meta tags, options) in read-only form,
 * highlighting correct vs user answer for MCQ, or showing numeric answer, etc.
 */
function QuestionReviewBlock({
  question,
  userAnswer,
}: {
  question: QuestionType
  userAnswer: string | null
}) {
  const isChoice =
    question.type === "Multiple Choice" || question.type === "Multiple Correct"
  const correctAnswer = displayCorrectAnswer(question)

  return (
    <div className="border rounded p-4 mt-3 bg-white">
      {/* Title + meta tags */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
        <h4 className="font-medium text-lg">
          {question.subject
            ? `${question.subject} - Question`
            : "Question"}{" "}
          {question.id || ""}
        </h4>
        {renderQuestionMeta(question)}
      </div>

      {renderDiagram(question.diagramUrl)}

      {question.text && (
        <div className="text-base sm:text-lg md:text-xl leading-7 mb-4 text-gray-700">
          <MathRenderer text={question.text} />
        </div>
      )}

      {isChoice && question.options ? (
        <>
          {renderOptions(question, userAnswer)}
          {question.type === "Multiple Correct" && (
            <p className="mt-2 text-sm text-gray-700">
              <strong>Correct option(s):</strong> {correctAnswer}
            </p>
          )}
        </>
      ) : question.type === "Subjective" ? (
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div>
            <strong>Your Answer:</strong>
            <div className="mt-1 whitespace-pre-wrap rounded border bg-gray-50 p-2">
              {userAnswer ? <MathRenderer text={userAnswer} /> : "Not answered"}
            </div>
          </div>
          <div>
            <strong>Model Answer:</strong>
            <div className="mt-1 whitespace-pre-wrap rounded border bg-green-50 p-2">
              <MathRenderer text={correctAnswer} />
            </div>
          </div>
          <p className="text-xs italic text-gray-500">
            Subjective answers are not auto-scored — compare against the model answer.
          </p>
        </div>
      ) : (
        // Integer / Numerical
        <div className="mt-4 text-sm text-gray-700">
          <p>
            <strong>Your Answer:</strong>{" "}
            {displayUserAnswer(question, userAnswer)}
          </p>
          <p>
            <strong>Correct Answer:</strong> {correctAnswer}
          </p>
        </div>
      )}
    </div>
  )
}

/** The main default export: advanced exam results page with multi-tab layout. */
export default function AdvancedExamResults({
  examResults,
  onStartNewExam,
  onExit,
}: {
  examResults: ExamResultsType
  onStartNewExam: () => void
  onExit: () => void
}) {
  // In this example, we use a local "theme = 'light'" for the motion buttons.
  // If you have a real theming system (e.g. next-themes), feel free to replace.
  const theme = "light"

  const [difficultyFilter, setDifficultyFilter] =
    useState<"All" | "Easy" | "Medium" | "Hard">("All")

  // Filter by difficulty, if user wants
  const filteredQuestions = useMemo(() => {
    if (difficultyFilter === "All") return examResults.questions
    return examResults.questions.filter(
      (q) => (q.difficulty || "") === difficultyFilter
    )
  }, [examResults.questions, difficultyFilter])

  // Sort topicPerformance by topic name (A→Z)
  const sortedTopicPerformance = useMemo(() => {
    return Object.entries(examResults.topicPerformance).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  }, [examResults.topicPerformance])

  // Sort incorrectAnswers by topic name (A→Z)
  const sortedTopicWiseIncorrect = useMemo(() => {
    return Object.entries(examResults.topicWiseIncorrectAnswers).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  }, [examResults.topicWiseIncorrectAnswers])

  /** Build PDF content */
  function generatePdfContent() {
    const content = document.createElement("div")
    content.innerHTML = `
      <h1 style="font-size:1.25rem; margin-bottom:1rem;">Exam Results</h1>
      <p>Total Questions: ${examResults.totalQuestions}</p>
      <p>Correct Answers: ${examResults.correctAnswersCount}</p>
      <p>Incorrect Answers: ${examResults.incorrectAnswers}</p>
      <p>Score: ${examResults.score.toFixed(2)}%</p>
      <p>Average Time per Question: ${formatTime(
        Math.round(examResults.averageTimePerQuestion)
      )}</p>
      <!-- You can also add more data: topicPerformance, etc. -->
    `
    return content
  }

  function handleDownloadPdf() {
    // Example usage with html2pdf (just a quick snippet)
    const content = generatePdfContent()
    const options = {
      margin: 10,
      filename: "exam_results.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }
    html2pdf().from(content).set(options).save()
  }

  // Small chart example
  const TopicPerformance = () => (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
          <PieChart className="w-6 h-6 mr-2 text-primary" />
          Topic Performance (A→Z)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Pie
              data={{
                labels: sortedTopicPerformance.map(([topic]) => topic),
                datasets: [
                  {
                    data: sortedTopicPerformance.map(([_, p]) => p.correct),
                    backgroundColor: [
                      "rgba(255, 99, 132, 0.8)",
                      "rgba(54, 162, 235, 0.8)",
                      "rgba(255, 206, 86, 0.8)",
                      "rgba(75, 192, 192, 0.8)",
                      "rgba(153, 102, 255, 0.8)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                  title: { display: true, text: "Correct Answers by Topic" },
                },
              }}
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {sortedTopicPerformance.map(([topic, performance]) => {
                const percent = (performance.correct / performance.total) * 100
                return (
                  <div key={topic}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{topic}</span>
                      <span className="font-bold">{percent.toFixed(2)}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )

  // The main return
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8"
    >
      {/* Title + subtitle */}
      <div className="text-center space-y-2">
        <motion.h1
          className="text-3xl font-normal tracking-tight text-center mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Exam Results
        </motion.h1>
        <motion.p
          className="text-xl font-normal tracking-tight text-center text-muted-foreground mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Your performance at a glance
        </motion.p>
      </div>

      {/* Example: PDF + Score */}
      <div className="sticky top-0 bg-background z-10 p-4 mb-8 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-2xl font-semibold">
          Score: {examResults.score.toFixed(2)}%
        </span>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
          <Download className="w-4 h-4 mr-2" />
          Download Results PDF
        </Button>
        <Progress value={examResults.score} className="mt-2 sm:mt-0 w-full sm:w-1/3" />
      </div>

      {/* TABS -> summary / performance / review */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start mb-8 space-x-2 overflow-x-auto">
          <TabsTrigger value="summary" className="font-normal">
            Summary
          </TabsTrigger>
          <TabsTrigger value="performance" className="font-normal">
            Performance
          </TabsTrigger>
          <TabsTrigger value="review" className="font-normal">
            Review
          </TabsTrigger>
        </TabsList>

        <motion.div
          key="results-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {/* 1) SUMMARY TAB */}
          <TabsContent value="summary" className="space-y-8">
            {/* Example Summary Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
              <CardHeader className="border-b border-primary/10">
                <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-primary">
                  <Award className="w-6 h-6 mr-2" />
                  Exam Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Total Questions:{" "}
                      <span className="font-bold text-primary">
                        {examResults.totalQuestions}
                      </span>
                    </p>
                    <p className="text-sm font-medium">
                      Correct Answers:{" "}
                      <span className="font-bold text-green-600">
                        {examResults.correctAnswersCount}
                      </span>
                    </p>
                    <p className="text-sm font-medium">
                      Incorrect Answers:{" "}
                      <span className="font-bold text-red-600">
                        {examResults.incorrectAnswers}
                      </span>
                    </p>
                    {examResults.ungradedQuestions > 0 && (
                      <p className="text-sm font-medium">
                        Not auto-graded (subjective):{" "}
                        <span className="font-bold text-gray-500">
                          {examResults.ungradedQuestions}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Score:{" "}
                      <span className="font-bold text-primary">
                        {examResults.score.toFixed(2)}%
                      </span>
                      {examResults.ungradedQuestions > 0 && (
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          (of {examResults.gradedQuestions} auto-graded)
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-medium">
                      Avg Time per Q:{" "}
                      <span className="font-bold">
                        {formatTime(Math.round(examResults.averageTimePerQuestion))}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Progress value={examResults.score} className="h-2 w-full" />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Your performance
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses (example) */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <Card className="bg-gradient-to-br from-green-100 to-green-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-green-800">
                    <Award className="w-6 h-6 mr-2" />
                    Top Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {examResults.topStrengths.map(([topic, performance], idx) => (
                      <li key={topic} className="flex items-center">
                        <span className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-3 text-green-800 font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{topic}</p>
                          <p className="text-sm text-green-600">
                            {((performance.correct / performance.total) * 100).toFixed(2)}% correct
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-yellow-800">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {examResults.topWeaknesses.map(([topic, performance], idx) => (
                      <li key={topic} className="flex items-center">
                        <span className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center mr-3 text-yellow-800 font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{topic}</p>
                          <p className="text-sm text-yellow-600">
                            {((performance.correct / performance.total) * 100).toFixed(2)}% correct
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2) PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-8">
            <TopicPerformance />
            <Card className="bg-gradient-to-br from-red-100 to-red-50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-red-800">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  Topics with Most Incorrect Answers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Bar
                  data={{
                    labels: sortedTopicWiseIncorrect.map(([topic]) => topic),
                    datasets: [
                      {
                        label: "Incorrect Answers",
                        data: sortedTopicWiseIncorrect.map(([_, val]) => val),
                        backgroundColor: "rgba(255, 99, 132, 0.8)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "top" as const },
                      title: {
                        display: true,
                        text: "Incorrect Answers by Topic (A→Z)",
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3) REVIEW TAB */}
          <TabsContent value="review">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-primary" />
                  Answer Review
                </CardTitle>
                <CardDescription>
                  Filter by difficulty:
                  {/* Animated difficulty buttons */}
                  <div className="flex space-x-2 mt-2">
                    {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => {
                      const isSelected = difficultyFilter === diff

                      return (
                        <motion.button
                          key={diff}
                          onClick={() => setDifficultyFilter(diff)}
                          layout
                          initial={false}
                          animate={{
                            backgroundColor: isSelected
                              ? theme === "light"
                                ? "#e6f7ff"
                                : "#2a1711"
                              : theme === "light"
                              ? "rgba(229, 231, 235, 0.5)"
                              : "rgba(39, 39, 42, 0.5)",
                          }}
                          whileHover={{
                            backgroundColor: isSelected
                              ? theme === "light"
                                ? "#cceeff"
                                : "#2a1711"
                              : theme === "light"
                              ? "rgba(229, 231, 235, 0.8)"
                              : "rgba(39, 39, 42, 0.8)",
                          }}
                          whileTap={{
                            backgroundColor: isSelected
                              ? theme === "light"
                                ? "#b3e6ff"
                                : "#1f1209"
                              : theme === "light"
                              ? "rgba(229, 231, 235, 0.9)"
                              : "rgba(39, 39, 42, 0.9)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            backgroundColor: { duration: 0.1 },
                          }}
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                            whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
                            ${
                              isSelected
                                ? theme === "light"
                                  ? "text-blue-600 ring-blue-200"
                                  : "text-[#ff9066] ring-[hsla(0,0%,100%,0.12)]"
                                : theme === "light"
                                  ? "text-gray-600 ring-gray-200"
                                  : "text-zinc-400 ring-[hsla(0,0%,100%,0.06)]"
                            }
                          `}
                        >
                          <motion.div
                            className="relative flex items-center"
                            animate={{
                              width: isSelected ? "auto" : "100%",
                              paddingRight: isSelected ? "1.25rem" : "0",
                            }}
                            transition={{
                              ease: [0.175, 0.885, 0.32, 1.275],
                              duration: 0.3,
                            }}
                          >
                            <span>{diff}</span>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                  className="absolute right-0"
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded-full ${
                                      theme === "light" ? "bg-blue-500" : "bg-[#ff9066]"
                                    } flex items-center justify-center`}
                                  >
                                    <Check
                                      className={`w-2.5 h-2.5 ${
                                        theme === "light"
                                          ? "text-white"
                                          : "text-[#2a1711]"
                                      }`}
                                      strokeWidth={2}
                                    />
                                  </div>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <ScrollArea className="h-[400px]">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredQuestions.map((question, index) => {
                      // userAnswers / timeSpentPerQuestion are indexed by the
                      // ORIGINAL question order, so map back through the
                      // unfiltered list (the difficulty filter reorders these).
                      const originalIndex = examResults.questions.indexOf(question)
                      const userA = examResults.userAnswers[originalIndex] || null
                      const grade = gradeAnswer(question, userA)
                      const timeSpent = examResults.timeSpentPerQuestion[originalIndex]

                      return (
                        <AccordionItem
                          value={`question-${index}`}
                          key={question.id || `q-${index}`}
                        >
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <span
                                className={`
                                  w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white
                                  ${grade === null ? "bg-gray-400" : grade ? "bg-green-500" : "bg-red-500"}
                                `}
                                title={
                                  grade === null
                                    ? "Not auto-graded"
                                    : grade
                                    ? "Correct"
                                    : "Incorrect"
                                }
                              >
                                {grade === null ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : grade ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </span>
                              <span className="mr-2">Question {index + 1}</span>
                              {/* If we want to display difficulty or topic as a small pill: */}
                              {question.difficulty && (
                                <span className="text-xs border px-2 py-0.5 ml-2 rounded-full">
                                  {question.difficulty}
                                </span>
                              )}
                              {question.topic && (
                                <span className="text-xs border px-2 py-0.5 ml-2 rounded-full">
                                  {question.topic}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {/* The new read-only question block: */}
                              <QuestionReviewBlock
                                question={question}
                                userAnswer={userA}
                              />

                              <p className="text-sm text-gray-700 mt-3">
                                <strong>Time Spent:</strong>{" "}
                                {formatTime(timeSpent)}
                              </p>

                              {/* Additional explanation if you like */}
                              {question.explanation && (
                                <div className="text-sm mt-2 text-muted-foreground">
                                  <strong>Explanation:</strong>{" "}
                                  {typeof question.explanation === "string" ? (
                                    <MathRenderer text={question.explanation} />
                                  ) : (
                                    JSON.stringify(question.explanation)
                                  )}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>

      {/* Bottom CTA => exit / new exam */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-between mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Button variant="outline" className="flex items-center gap-2" onClick={onExit}>
          <ArrowLeft className="w-4 h-4" />
          Exit to Mock Exam
        </Button>
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onStartNewExam}
        >
          Start New Exam
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

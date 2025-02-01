"use client"

import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  ArrowLeft,
  Download,
  Target,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PieChart,
  ArrowRight,
} from "lucide-react"

import { Pie, Bar } from "react-chartjs-2"
import html2pdf from "html2pdf.js"
import "chart.js/auto"
import MathRenderer from "@/components/layout/MathRenderer"

import type { ExamResultsType } from "@/lib/exam-helpers"

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export default function AdvancedExamResults({
  examResults,
  onStartNewExam,
  onExit,
}: {
  examResults: ExamResultsType
  onStartNewExam: () => void
  onExit: () => void
}) {
  const [difficultyFilter, setDifficultyFilter] = useState<"Easy" | "Medium" | "Hard" | "All">("All")

  // Filtered questions => if difficulty != "All", filter by that
  const filteredQuestions = useMemo(() => {
    if (difficultyFilter === "All") return examResults.questions
    return examResults.questions.filter((q) => (q.difficulty || "") === difficultyFilter)
  }, [examResults.questions, difficultyFilter])

  // Sort topicPerformance alphabetically
  const sortedTopicPerformance = useMemo(() => {
    return Object.entries(examResults.topicPerformance).sort(([a], [b]) => a.localeCompare(b))
  }, [examResults.topicPerformance])

  // Sort topicWiseIncorrectAnswers alphabetically
  const sortedTopicWiseIncorrect = useMemo(() => {
    return Object.entries(examResults.topicWiseIncorrectAnswers).sort(([a], [b]) => a.localeCompare(b))
  }, [examResults.topicWiseIncorrectAnswers])

  // PDF generation
  const generatePdfContent = () => {
    const content = document.createElement("div")
    content.innerHTML = `
      <h1 style="font-size: 1.25rem; margin-bottom: 1rem;">Exam Results</h1>
      <h2 style="font-size: 1rem; margin-bottom: 0.5rem;">Summary</h2>
      <p>Total Questions: ${examResults.totalQuestions}</p>
      <p>Correct Answers: ${examResults.correctAnswersCount}</p>
      <p>Incorrect Answers: ${examResults.incorrectAnswers}</p>
      <p>Score: ${examResults.score.toFixed(2)}%</p>
      <p>Average Time per Question: ${formatTime(Math.round(examResults.averageTimePerQuestion))}</p>
      
      <h2 style="font-size: 1rem; margin: 1rem 0 0.5rem;">Topic Performance (A→Z)</h2>
      ${sortedTopicPerformance
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}% correct</p>`
        })
        .join("")}
      
      <h2 style="font-size: 1rem; margin: 1rem 0 0.5rem;">Strengths</h2>
      ${examResults.topStrengths
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}% correct</p>`
        })
        .join("")}
      
      <h2 style="font-size: 1rem; margin: 1rem 0 0.5rem;">Areas for Improvement</h2>
      ${examResults.topWeaknesses
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}% correct</p>`
        })
        .join("")}
      
      <h2 style="font-size: 1rem; margin: 1rem 0 0.5rem;">Question Review</h2>
      ${examResults.questions
        .map((q, i) => {
          const time = formatTime(examResults.timeSpentPerQuestion[i])
          const userA = examResults.userAnswers[i] || "Not answered"
          return `
            <h3>Question ${i + 1}</h3>
            <p>${q.text}</p>
            <p>Your Answer: ${userA}</p>
            <p>Correct Answer: ${q.correctOption}</p>
            <p>Time Spent: ${time}</p>
            <p>Explanation: ${
              q.explanation
                ? typeof q.explanation === "string"
                  ? q.explanation
                  : JSON.stringify(q.explanation)
                : ""
            }</p>
          `
        })
        .join("")}
    `
    return content
  }

  const handleDownloadPdf = () => {
    const content = generatePdfContent()
    const opt = {
      margin: 10,
      filename: "exam_results.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }
    html2pdf().from(content).set(opt).save()
  }

  // UI Components
  // ----------------------------------------------------------------------------
  // 1) Summary
  // ----------------------------------------------------------------------------
  const SummaryCard = () => (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader className="border-b border-primary/10">
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-primary">
          <Target className="w-6 h-6 mr-2" />
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
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Score:{" "}
              <span className="font-bold text-primary">
                {examResults.score.toFixed(2)}%
              </span>
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
  )

  // 2) Strengths / Weaknesses
  // ----------------------------------------------------------------------------
  const StrengthsAndWeaknesses = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/20">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-green-800 dark:text-green-100">
            <Award className="w-6 h-6 mr-2" />
            Top Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-4">
            {examResults.topStrengths.map(([topic, performance], index) => (
              <li key={topic} className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center mr-3 text-green-800 dark:text-green-200 font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{topic}</p>
                  <p className="text-sm text-green-600">
                    {((performance.correct / performance.total) * 100).toFixed(2)}
                    % correct
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/20">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-yellow-800 dark:text-yellow-100">
            <TrendingUp className="w-6 h-6 mr-2" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-4">
            {examResults.topWeaknesses.map(([topic, performance], index) => (
              <li key={topic} className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center mr-3 text-yellow-800 dark:text-yellow-200 font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{topic}</p>
                  <p className="text-sm text-yellow-600">
                    {((performance.correct / performance.total) * 100).toFixed(2)}
                    % correct
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )

  // 3) TopicPerformance => alphabetical
  // ----------------------------------------------------------------------------
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
                  legend: {
                    position: "bottom",
                  },
                  title: {
                    display: true,
                    text: "Correct Answers by Topic",
                  },
                },
              }}
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {sortedTopicPerformance.map(([topic, performance]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{topic}</span>
                    <span className="font-bold">
                      {((performance.correct / performance.total) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={(performance.correct / performance.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )

  // 4) IncorrectAnswers => alphabetical
  // ----------------------------------------------------------------------------
  const IncorrectAnswers = () => (
    <Card className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/20">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center text-red-800 dark:text-red-100">
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
              legend: {
                position: "top" as const,
              },
              title: {
                display: true,
                text: "Incorrect Answers by Topic (A→Z)",
              },
            },
          }}
        />
      </CardContent>
    </Card>
  )

  // 5) The "Answer Review" => we show the "question bank" style block
  // but minimal features: question text, user’s selected option, feedback, explanation
  // ----------------------------------------------------------------------------
  const AnswerReview = () => (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-primary" />
          Answer Review
        </CardTitle>
        <CardDescription>
          Filter by difficulty:
          <div className="flex space-x-2 mt-2">
            {["All", "Easy", "Medium", "Hard"].map((diff) => (
              <Badge
                key={diff}
                variant={difficultyFilter === diff ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDifficultyFilter(diff as any)}
              >
                {diff}
              </Badge>
            ))}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {filteredQuestions.map((question, index) => {
              const userAns = examResults.userAnswers[index] || ""
              const correctAns = question.correctOption || ""
              const isCorrect = userAns === correctAns

              return (
                <Card
                  key={question.id || index}
                  className="
                    border-2
                    p-4
                    mb-4
                    last:mb-0
                    space-y-3
                    dark:bg-slate-800
                    dark:text-slate-100
                    relative
                    shadow-sm
                  "
                  style={{
                    borderColor: isCorrect ? "#10b981" : "#ef4444",
                  }}
                >
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    Question {index + 1}
                    {question.difficulty && (
                      <Badge variant="outline" className="ml-2">
                        {question.difficulty}
                      </Badge>
                    )}
                    {question.topic && (
                      <Badge variant="outline" className="ml-2">
                        {question.topic}
                      </Badge>
                    )}
                  </div>
                  {question.text && (
                    <div className="text-base sm:text-lg leading-6 latex-font">
                      <MathRenderer text={question.text} />
                    </div>
                  )}
                  {/* If MCQ => highlight user selection in color */}
                  {Array.isArray(question.options) && question.options.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {question.options.map((optionText, idxOpt) => {
                        const letter = String.fromCharCode(65 + idxOpt)
                        const isUserChoice = userAns === letter
                        const isCorrectChoice = letter === correctAns

                        const background =
                          isUserChoice && isCorrect
                            ? "bg-green-100 text-green-700 border-green-400"
                            : isUserChoice && !isCorrect
                            ? "bg-red-100 text-red-700 border-red-400"
                            : "border-gray-300"

                        return (
                          <div
                            key={idxOpt}
                            className={`
                              px-3 py-2 rounded-md border
                              ${background}
                              flex items-start space-x-2
                            `}
                          >
                            <span className="font-semibold">{letter}.</span>
                            <div className="latex-font w-full">
                              <MathRenderer text={optionText} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {/* If user is incorrect => show correct answer explicitly */}
                  {!isCorrect && correctAns && (
                    <div className="mt-1 text-sm">
                      Correct Answer:
                      <span className="text-green-700 font-semibold ml-1">
                        {correctAns}
                      </span>
                    </div>
                  )}
                  {/* Show time spent */}
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    Time Spent:{" "}
                    {formatTime(examResults.timeSpentPerQuestion[index] || 0)}
                  </div>
                  {/* Explanation if any */}
                  {question.explanation && (
                    <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-100">
                      <span className="font-semibold">Explanation:</span>
                      <div className="latex-font mt-1">
                        {typeof question.explanation === "string" ? (
                          <MathRenderer text={question.explanation} />
                        ) : (
                          JSON.stringify(question.explanation)
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  // ----------------------------------------------------------------
  // Return top-level layout
  // ----------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8"
    >
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

      {/* Sticky top bar => PDF download */}
      <div className="sticky top-0 bg-background z-10 p-4 mb-8 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-2xl font-semibold">
          Score: {examResults.score.toFixed(2)}%
        </span>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
          <Download className="w-4 h-4 mr-2" />
          Download Results PDF
        </Button>
        <Progress
          value={examResults.score}
          className="mt-2 sm:mt-0 w-full sm:w-1/3"
        />
      </div>

      {/* Tabs => summary / performance / review */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start mb-8 space-x-2 overflow-x-auto">
          <TabsTrigger value="summary" className="font-normal">
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="font-normal text-muted-foreground"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="font-normal text-muted-foreground"
          >
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
          {/* 1) summary tab */}
          <TabsContent value="summary" className="space-y-8">
            <SummaryCard />
            <StrengthsAndWeaknesses />
          </TabsContent>

          {/* 2) performance tab */}
          <TabsContent value="performance" className="space-y-8">
            <TopicPerformance />
            <IncorrectAnswers />
          </TabsContent>

          {/* 3) review tab => the new question-block style review */}
          <TabsContent value="review">
            <AnswerReview />
          </TabsContent>
        </motion.div>
      </Tabs>

      {/* Bottom CTA buttons => exit / new exam */}
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

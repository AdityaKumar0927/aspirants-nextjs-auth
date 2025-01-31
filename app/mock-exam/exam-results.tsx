"use client"

import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  ArrowLeft,
  Download,
  Target,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PieChart,
  LineChart,
  Lightbulb,
  BookOpen,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Pie, Bar, Radar } from "react-chartjs-2"
import html2pdf from "html2pdf.js"
import "chart.js/auto"
import type { ExamResultsType } from "@/lib/exam-helpers"

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function AdvancedExamResults({
  examResults,
  onStartNewExam,
  onExit,
}: {
  examResults: ExamResultsType
  onStartNewExam: () => void
  onExit: () => void
}) {
  const [difficultyFilter, setDifficultyFilter] = useState<"Easy" | "Medium" | "Hard" | "All">("All")

  const filteredQuestions = useMemo(() => {
    if (difficultyFilter === "All") {
      return examResults.questions
    }
    return examResults.questions.filter((q) => (q.difficulty || "") === difficultyFilter)
  }, [examResults.questions, difficultyFilter])

  const generatePdfContent = () => {
    const content = document.createElement("div")
    content.innerHTML = `
      <h1>Exam Results</h1>
      <h2>Summary</h2>
      <p>Total Questions: ${examResults.totalQuestions}</p>
      <p>Correct Answers: ${examResults.correctAnswersCount}</p>
      <p>Incorrect Answers: ${examResults.incorrectAnswers}</p>
      <p>Score: ${examResults.score.toFixed(2)}%</p>
      <p>Average Time per Question: ${formatTime(Math.round(examResults.averageTimePerQuestion))}</p>
      
      <h2>Topic Performance</h2>
      ${Object.entries(examResults.topicPerformance)
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}%</p>`
        })
        .join("")}
      
      <h2>Strengths</h2>
      ${examResults.topStrengths
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}%</p>`
        })
        .join("")}
      
      <h2>Areas for Improvement</h2>
      ${examResults.topWeaknesses
        .map(([topic, performance]) => {
          const pct = (performance.correct / performance.total) * 100
          return `<p>${topic}: ${pct.toFixed(2)}%</p>`
        })
        .join("")}
      
      <h2>Question Review</h2>
      ${examResults.questions
        .map((question, index) => {
          return `
            <h3>Question ${index + 1}</h3>
            <p>${question.text}</p>
            <p>Your Answer: ${examResults.userAnswers[index] || "Not answered"}</p>
            <p>Correct Answer: ${question.correctOption}</p>
            <p>Time Spent: ${formatTime(examResults.timeSpentPerQuestion[index])}</p>
            <p>Explanation: ${question.explanation || ""}</p>
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
              Total Questions: <span className="font-bold text-primary">{examResults.totalQuestions}</span>
            </p>
            <p className="text-sm font-medium">
              Correct Answers: <span className="font-bold text-green-600">{examResults.correctAnswersCount}</span>
            </p>
            <p className="text-sm font-medium">
              Incorrect Answers: <span className="font-bold text-red-600">{examResults.incorrectAnswers}</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Score: <span className="font-bold text-primary">{examResults.score.toFixed(2)}%</span>
            </p>
            <p className="text-sm font-medium">
              Average Time per Question:{" "}
              <span className="font-bold">{formatTime(Math.round(examResults.averageTimePerQuestion))}</span>
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Progress value={examResults.score} className="h-2 w-full" />
          <p className="text-xs text-muted-foreground mt-2 text-center">Your performance</p>
        </div>
      </CardContent>
    </Card>
  )

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
                    {((performance.correct / performance.total) * 100).toFixed(2)}% correct
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
                    {((performance.correct / performance.total) * 100).toFixed(2)}% correct
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )

  const TopicPerformance = () => (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
          <PieChart className="w-6 h-6 mr-2 text-primary" />
          Topic Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Pie
              data={{
                labels: Object.keys(examResults.topicPerformance),
                datasets: [
                  {
                    data: Object.values(examResults.topicPerformance).map((p) => p.correct),
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
              {Object.entries(examResults.topicPerformance).map(([topic, performance]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{topic}</span>
                    <span className="font-bold">{((performance.correct / performance.total) * 100).toFixed(2)}%</span>
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
            labels: Object.keys(examResults.topicWiseIncorrectAnswers),
            datasets: [
              {
                label: "Incorrect Answers",
                data: Object.values(examResults.topicWiseIncorrectAnswers),
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
                text: "Incorrect Answers by Topic",
              },
            },
          }}
        />
      </CardContent>
    </Card>
  )

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
          <Accordion type="single" collapsible className="w-full">
            {filteredQuestions.map((question, index) => {
              const isCorrect = examResults.userAnswers[index] === question.correctOption
              return (
                <AccordionItem value={`question-${index}`} key={question.id}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white ${
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span>Question {index + 1}</span>
                      {question.difficulty ? (
                        <Badge variant="outline" className="ml-2">
                          {question.difficulty}
                        </Badge>
                      ) : null}
                      {question.topic ? (
                        <Badge variant="outline" className="ml-2">
                          {question.topic}
                        </Badge>
                      ) : null}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p className="font-medium">{question.text}</p>
                      <p>
                        Your Answer:{" "}
                        <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {examResults.userAnswers[index] || "Not answered"}
                        </span>
                      </p>
                      <p>
                        Correct Answer: <span className="text-green-600 font-semibold">{question.correctOption}</span>
                      </p>
                      <p>
                        Time Spent:{" "}
                        <span className="font-semibold">{formatTime(examResults.timeSpentPerQuestion[index])}</span>
                      </p>
                      {question.explanation ? (
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const SkillAssessment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
          <LineChart className="w-6 h-6 mr-2 text-primary" />
          Skill Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full max-w-md mx-auto">
          <Radar
            data={{
              labels: Object.keys(examResults.skillLevels),
              datasets: [
                {
                  label: "Skill Level",
                  data: Object.values(examResults.skillLevels),
                  backgroundColor: "rgba(54, 162, 235, 0.2)",
                  borderColor: "rgb(54, 162, 235)",
                  pointBackgroundColor: "rgb(54, 162, 235)",
                  pointBorderColor: "#fff",
                  pointHoverBackgroundColor: "#fff",
                  pointHoverBorderColor: "rgb(54, 162, 235)",
                },
              ],
            }}
            options={{
              scales: {
                r: {
                  angleLines: {
                    display: false,
                  },
                  suggestedMin: 0,
                  suggestedMax: 100,
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  )

  const Recommendations = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight flex items-center">
          <Lightbulb className="w-6 h-6 mr-2 text-primary" />
          Personalized Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="space-y-4">
          {examResults.topWeaknesses.map(([topic]) => (
            <li key={topic} className="flex items-start">
              <BookOpen className="w-5 h-5 mr-2 mt-1 text-primary" />
              <div>
                <p className="font-semibold">Improve your {topic} skills</p>
                <p className="text-sm text-muted-foreground">
                  We recommend reviewing chapters related to {topic}, practicing more problems, and revisiting
                  fundamental concepts.
                </p>
              </div>
            </li>
          ))}
          <li className="flex items-start">
            <Clock className="w-5 h-5 mr-2 mt-1 text-primary" />
            <div>
              <p className="font-semibold">Time Management</p>
              <p className="text-sm text-muted-foreground">
                Your average time per question is {formatTime(Math.round(examResults.averageTimePerQuestion))}. Try to
                improve your speed without sacrificing accuracy.
              </p>
            </div>
          </li>
        </ul>
      </CardContent>
    </Card>
  )

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

      <div className="sticky top-0 bg-background z-10 p-4 mb-8 border-b">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-semibold">Score: {examResults.score.toFixed(2)}%</span>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download Results PDF
          </Button>
        </div>
        <Progress value={examResults.score} className="mt-2" />
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start mb-8">
          <TabsTrigger value="summary" className="font-normal">
            Summary
          </TabsTrigger>
          <TabsTrigger value="performance" className="font-normal text-muted-foreground">
            Performance
          </TabsTrigger>
          <TabsTrigger value="review" className="font-normal text-muted-foreground">
            Review
          </TabsTrigger>
          <TabsTrigger value="skills" className="font-normal text-muted-foreground">
            Skills
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="font-normal text-muted-foreground">
            Recommendations
          </TabsTrigger>
        </TabsList>
        <motion.div
          key="results-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <TabsContent value="summary" className="space-y-8">
            <SummaryCard />
            <StrengthsAndWeaknesses />
          </TabsContent>
          <TabsContent value="performance" className="space-y-8">
            <TopicPerformance />
            <IncorrectAnswers />
          </TabsContent>
          <TabsContent value="review">
            <AnswerReview />
          </TabsContent>
          <TabsContent value="skills">
            <SkillAssessment />
          </TabsContent>
          <TabsContent value="recommendations">
            <Recommendations />
          </TabsContent>
        </motion.div>
      </Tabs>

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
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" onClick={onStartNewExam}>
          Start New Exam
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default AdvancedExamResults


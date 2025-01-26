"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import Image from "next/image"

import MathRenderer from "@/components/layout/MathRenderer" // The KaTeX-based component
import { QuestionType } from "@/lib/exam-helpers"            // Use your single source of truth

interface ExamProps {
  currentQuestion: number
  filteredQuestions: QuestionType[]
  answers: (string | null)[]
  questionStatuses: { [index: number]: string }
  questionStatusCounts: {
    notVisited: number
    notAnswered: number
    answered: number
    markedForReview: number
  }
  examTimeLeft: number
  onAnswer: (answer: string) => void
  onNext: () => void
  onPrevious: () => void
  onClear: () => void
  onReviewAndNext: () => void
  onSaveAndNext: () => void
  onSubmit: () => void
  onExit: () => void
  onNavigate: (index: number) => void

  userName: string
  selectedSubject: string
  selectedYear: string
  selectedLevel: string
}

export default function Exam({
  currentQuestion,
  filteredQuestions,
  answers,
  questionStatuses,
  questionStatusCounts,
  examTimeLeft,
  onAnswer,
  onNext,
  onPrevious,
  onClear,
  onReviewAndNext,
  onSaveAndNext,
  onSubmit,
  onExit,
  onNavigate,
  userName,
  selectedSubject,
  selectedYear,
  selectedLevel,
}: ExamProps) {
  // Format time
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const question = filteredQuestions[currentQuestion]
  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">No question available. Please restart the exam.</p>
        <Button onClick={onExit}>Exit</Button>
      </div>
    )
  }

  // Renders the diagram if present
  function renderDiagram(diagramUrl?: string) {
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

  // Renders MCQ or integer input
  function renderQuestionBody(q: QuestionType) {
    const lowerType = (q.type || "").toLowerCase()

    // If 'mcq', 'mcqm', 'multiple choice', etc.:
    if (
      lowerType.includes("mcq") ||
      lowerType === "multiple choice" ||
      lowerType === "mcqm"
    ) {
      return (
        <div className="space-y-4 mt-4">
          {Object.entries(q.options).map(([key, optionText]) => {
            const isSelected = answers[currentQuestion] === key
            return (
              <Button
                key={key}
                variant={isSelected ? "secondary" : "outline"}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => onAnswer(key)}
              >
                <span className="font-semibold mr-2">{key}.</span>
                <MathRenderer text={optionText} />
              </Button>
            )
          })}
        </div>
      )
    }
    // If 'numerical', 'integer', etc.:
    else if (
      lowerType.includes("num") ||
      lowerType.includes("int") ||
      lowerType === "numerical" ||
      lowerType === "integer"
    ) {
      const currentVal = answers[currentQuestion] || ""
      return (
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Enter your numeric answer..."
            value={currentVal}
            onChange={(e) => onAnswer(e.target.value)}
          />
        </div>
      )
    } else {
      // fallback
      return (
        <p className="text-red-500">
          Unknown question type: {q.type}. Cannot render.
        </p>
      )
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header: user info, timer, exit */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium">{userName}</h2>
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
              <Button variant="ghost" size="icon" onClick={onExit}>
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main area */}
      <main className="flex-grow flex overflow-hidden">
        {/* Left side: question */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 max-h-screen flex flex-col">
          <Card className="mb-6 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Question {currentQuestion + 1}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {currentQuestion + 1} of {filteredQuestions.length}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              {renderDiagram(question.diagramUrl)}

              {/* Question text (with math) */}
              <div className="text-gray-700 mb-4 text-base sm:text-lg md:text-xl leading-7">
                <MathRenderer text={question.text} />
              </div>

              {/* MCQ or numeric input */}
              {renderQuestionBody(question)}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 justify-between w-full">
                {/* Nav buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={onPrevious}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={onNext}
                    variant="outline"
                    className="flex items-center"
                    disabled={currentQuestion === filteredQuestions.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button onClick={onClear} variant="outline">
                    Clear
                  </Button>
                  <Button onClick={onReviewAndNext} variant="outline">
                    Mark for Review & Next
                  </Button>
                  <Button onClick={onSaveAndNext} variant="outline">
                    Save & Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="flex justify-center mt-6">
            <Button
              onClick={() => {
                if (window.confirm("Are you sure you want to submit the exam?")) {
                  onSubmit()
                }
              }}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 py-2 text-lg font-light"
              variant="outline"
            >
              Submit Exam
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-auto" />

        {/* Right side: navigator/status */}
        <div className="w-80 bg-background overflow-y-auto p-4 space-y-6 max-h-screen">
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
                  <span className="font-medium">{questionStatusCounts.notVisited}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    Not Answered
                  </span>
                  <span className="font-medium">{questionStatusCounts.notAnswered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Answered
                  </span>
                  <span className="font-medium">{questionStatusCounts.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm">
                    <Flag className="w-4 h-4 mr-2 text-blue-500" />
                    Marked for Review
                  </span>
                  <span className="font-medium">
                    {questionStatusCounts.markedForReview}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, index) => {
                  const status = questionStatuses[index] || "notVisited"
                  const isCurrent = currentQuestion === index

                  let btn = "w-10 h-10 p-0 font-medium"
                  if (isCurrent) {
                    btn += " border-blue-800 bg-blue-100 text-blue-600"
                  } else if (status === "markedForReview") {
                    btn += " border-blue-600 bg-blue-100 text-blue-600"
                  } else if (status === "notAnswered") {
                    btn += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  } else if (status === "answered") {
                    btn += " border-green-600 bg-green-100 text-green-600"
                  } else {
                    btn += " border-gray-300 bg-white text-gray-600"
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={btn}
                            onClick={() => onNavigate(index)}
                            aria-label={`Question ${index + 1}: ${status}`}
                          >
                            {index + 1}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{status}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

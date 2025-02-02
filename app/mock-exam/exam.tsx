"use client"

import React from "react"
import Image from "next/image"
import { User, Clock, AlertCircle, CheckCircle, Flag, LogOut, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"

import MathRenderer from "@/components/layout/MathRenderer"
import { QuestionType } from "@/lib/exam-helpers"

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

/**
 * Redesigned layout:
 * - Sticky header for user/timer/exit
 * - Main content is a grid:
 *    On mobile => 1 column (Question card → Status card → Navigator card)
 *    On md+    => 2 columns (Question card in left col, status+nav in right col).
 */
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
  // ----------------------------------
  // Format the countdown timer
  // ----------------------------------
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Current question (if any)
  const question = filteredQuestions[currentQuestion]
  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">No question is available. Please restart the exam.</p>
        <Button onClick={onExit}>Exit</Button>
      </div>
    )
  }

  // If question has a diagram => show
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

  // Renders either MCQ or numeric
  function renderQuestionBody(q: QuestionType) {
    const lower = (q.type || "").toLowerCase()

    // MCQ
    if (lower.includes("mcq") || lower === "multiple choice") {
      return (
        <div className="space-y-3 mt-4">
          {Object.entries(q.options).map(([key, text]) => {
            const isSelected = answers[currentQuestion] === key
            return (
              <Button
                key={key}
                variant={isSelected ? "secondary" : "outline"}
                className="w-full text-left py-3 px-4 h-auto"
                onClick={() => onAnswer(key)}
              >
                <span className="font-semibold mr-2">{key}.</span>
                <MathRenderer text={text} />
              </Button>
            )
          })}
        </div>
      )
    }
    // Numeric
    else if (lower.includes("num") || lower.includes("int")) {
      const val = answers[currentQuestion] || ""
      return (
        <div className="mt-4 flex gap-2 items-center">
          <Input
            type="text"
            value={val}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Enter numeric answer..."
          />
        </div>
      )
    }
    // Fallback
    return (
      <p className="text-red-500">
        Unsupported question type: <strong>{q.type}</strong>
      </p>
    )
  }

  // ----------------------------------
  // The main component
  // ----------------------------------
  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Sticky top bar: user info, timer, exit */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Left: user + exam info */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-medium leading-tight">{userName}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedSubject} ({selectedYear}) - {selectedLevel}
              </p>
            </div>
          </div>

          {/* Right: timer + exit */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(examTimeLeft)}
            </div>
            <Button variant="ghost" size="icon" onClick={onExit}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main => a grid w/ question on left, status+nav on right at md+ */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
        {/* ----------- Question Card ----------- */}
        <div className="flex flex-col">
          <Card className="w-full mb-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Question {currentQuestion + 1}</span>
                <span className="text-sm text-muted-foreground">
                  {currentQuestion + 1} of {filteredQuestions.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* If diagram */}
              {renderDiagram(question.diagramUrl)}

              {/* Question text */}
              {question.text && (
                <div className="text-gray-700 text-base sm:text-lg md:text-xl leading-7">
                  <MathRenderer text={question.text} />
                </div>
              )}

              {/* Options or numeric input */}
              {renderQuestionBody(question)}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 justify-between w-full">
                {/* Prev/Next */}
                <div className="flex gap-3">
                  <Button
                    onClick={onPrevious}
                    variant="outline"
                    disabled={currentQuestion === 0}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={onNext}
                    variant="outline"
                    disabled={currentQuestion === filteredQuestions.length - 1}
                    className="flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Clear / MarkReview / Save */}
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

          {/* Big "Submit" button on the bottom */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="w-full md:w-auto py-2 text-lg font-light"
              onClick={()=>{
                if(window.confirm("Are you sure you want to submit?")){
                  onSubmit();
                }
              }}
            >
              Submit Exam
            </Button>
          </div>
        </div>

        {/* ----------- Right Column (Status + Navigator) ----------- */}
        <div className="flex flex-col gap-4">
          {/* Question Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Question Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-gray-400" />
                  Not Visited
                </span>
                <span className="font-medium">{questionStatusCounts.notVisited}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                  Not Answered
                </span>
                <span className="font-medium">{questionStatusCounts.notAnswered}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  Answered
                </span>
                <span className="font-medium">{questionStatusCounts.answered}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Flag className="w-4 h-4 mr-1 text-blue-500" />
                  Marked for Review
                </span>
                <span className="font-medium">{questionStatusCounts.markedForReview}</span>
              </div>
            </CardContent>
          </Card>

          {/* Navigator card */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, idx) => {
                  const status = questionStatuses[idx] || "notVisited"
                  const isCurrent = currentQuestion === idx

                  let buttonClasses = "w-10 h-10 p-0 font-medium"
                  if (isCurrent) {
                    // current question style
                    buttonClasses += " border-blue-800 bg-blue-100 text-blue-600"
                  } else if (status === "markedForReview") {
                    buttonClasses += " border-blue-600 bg-blue-100 text-blue-600"
                  } else if (status === "notAnswered") {
                    buttonClasses += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  } else if (status === "answered") {
                    buttonClasses += " border-green-600 bg-green-100 text-green-600"
                  } else {
                    buttonClasses += " border-gray-300 bg-white text-gray-600"
                  }

                  return (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={buttonClasses}
                            onClick={() => onNavigate(idx)}
                            aria-label={`Q ${idx + 1}: ${status}`}
                          >
                            {idx + 1}
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
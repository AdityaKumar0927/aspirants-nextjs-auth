"use client"

import React, { useState } from "react"
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
  Menu,
  X,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import Image from "next/image"

// Use your KaTeX-based renderer:
import MathRenderer from "@/components/layout/MathRenderer"

// A typical dialog from your UI library or custom code:
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Import your single source of QuestionType from exam-helpers
import { QuestionType } from "@/lib/exam-helpers"

interface ExamProps {
  currentQuestion: number
  filteredQuestions: QuestionType[]
  answers: (string | null)[]        // user’s selected answers
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
 * A responsive exam layout:
 * - On desktop: 2 columns (question on left, navigator on right).
 * - On mobile: question full width, navigator is hidden by default
 *   and accessible via a “Navigator” button that opens a dialog.
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
  // For mobile, we can open a "drawer" or "dialog" to show the navigator
  const [navigatorOpen, setNavigatorOpen] = useState(false)

  // Format time as MM:SS
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

  // If there's a diagram:
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

  // Render MCQ or numeric input
  function renderQuestionBody(q: QuestionType) {
    const lower = (q.type || "").toLowerCase()

    // If it's some form of MCQ (like "mcq", "Multiple Choice", "mcqm", etc.)
    if (lower.includes("mcq") || lower === "multiple choice") {
      return (
        <div className="space-y-4 mt-4">
          {/* We'll assume q.options is an object { A: "...", B: "...", etc. } */}
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
    // If it's an integer / numeric type
    else if (lower.includes("num") || lower.includes("int")) {
      const val = answers[currentQuestion] || ""
      return (
        <div className="mt-4">
          <Input
            type="text"
            value={val}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Enter your numeric answer..."
          />
        </div>
      )
    }
    // fallback
    else {
      return (
        <p className="text-red-500">
          Unknown question type: {q.type}. Cannot render.
        </p>
      )
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header with user info, timer, exit, and mobile nav button */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* user info */}
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

          {/* timer + nav toggler on mobile + exit */}
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(examTimeLeft)}
            </div>
            {/* On mobile, show a button to open the navigator in a dialog */}
            <div className="block md:hidden">
              <Button variant="outline" onClick={() => setNavigatorOpen(true)}>
                <Menu className="mr-2 h-4 w-4" />
                Navigator
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={onExit}>
              <LogOut className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main area:
          - Desktop: 2 columns (question left, navigator right).
          - Mobile: question full width, navigator hidden (use dialog). */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT: question content */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 max-h-screen flex flex-col">
          <Card className="mb-6 max-w-4xl mx-auto w-full">
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

              <div className="text-gray-700 mb-4 text-base sm:text-lg md:text-xl leading-7">
                <MathRenderer text={question.text} />
              </div>

              {renderQuestionBody(question)}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 justify-between w-full">
                {/* Nav buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={onPrevious}
                    variant="outline"
                    disabled={currentQuestion === 0}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={onNext}
                    variant="outline"
                    disabled={currentQuestion === filteredQuestions.length - 1}
                    className="flex items-center"
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

        {/* Horizontal separator for mobile, vertical for desktop */}
        <Separator orientation="horizontal" className="block md:hidden" />
        <Separator orientation="vertical" className="hidden md:block" />

        {/* RIGHT: question navigator / status. 
            Visible on desktop, hidden on mobile. */}
        <div className="hidden md:block w-80 bg-background overflow-y-auto p-4 space-y-6 max-h-screen">
          {renderNavigator()}
        </div>
      </main>

      {/* MOBILE: a Dialog for the navigator */}
      <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
        <DialogContent className="fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Question Navigator</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setNavigatorOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4 space-y-4">{renderNavigator()}</div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Renders question status & navigator
  function renderNavigator() {
    return (
      <>
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
                <span className="font-medium">{questionStatusCounts.markedForReview}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Navigator</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-5 gap-2">
              {filteredQuestions.map((_, index) => {
                const status = questionStatuses[index] || "notVisited"
                const isCurrent = currentQuestion === index

                let classes = "w-10 h-10 p-0 font-medium"
                if (isCurrent) {
                  classes += " border-blue-800 bg-blue-100 text-blue-600"
                } else if (status === "markedForReview") {
                  classes += " border-blue-600 bg-blue-100 text-blue-600"
                } else if (status === "notAnswered") {
                  classes += " border-yellow-600 bg-yellow-100 text-yellow-600"
                } else if (status === "answered") {
                  classes += " border-green-600 bg-green-100 text-green-600"
                } else {
                  classes += " border-gray-300 bg-white text-gray-600"
                }

                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={classes}
                          onClick={() => {
                            onNavigate(index)
                            setNavigatorOpen(false) // close the dialog on mobile
                          }}
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
      </>
    )
  }
}

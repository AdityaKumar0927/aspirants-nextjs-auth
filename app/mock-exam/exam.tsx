"use client"

import React from "react"
import { Button } from "@/components/ui/button"
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

// KaTeX-based math rendering
import MathRenderer from "@/components/layout/MathRenderer"

// Single source-of-truth question type
import { QuestionType } from "@/lib/exam-helpers"

/**
 * Decide how to style the border, similar to `Question.tsx`,
 * based on the question's status: answered, markedForReview, etc.
 */
function getQuestionBorderClass(status: string) {
  switch (status) {
    case "markedForReview":
      return "border-[3px] border-orange-300/70"
    case "answered":
      return "border-[3px] border-green-300/70"
    case "notAnswered":
      return "border-[3px] border-red-300/70"
    default:
      // includes "notVisited" or any fallback
      return "border-[3px] border-gray-300/70"
  }
}

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
 * Mocks the styling from `Question.tsx` for the question block UI
 * but uses only your existing mock exam logic, so no DB calls or
 * "completed/correct" merges.
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
  // Format time as mm:ss
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Current question
  const question = filteredQuestions[currentQuestion]
  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-500 mb-4 text-center">
          No question available. Please restart the exam.
        </p>
        <Button onClick={onExit}>Exit</Button>
      </div>
    )
  }

  /**
   * Renders small "meta badges" (subject, difficulty, year, type, exam)
   * like the ones in Question.tsx.
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

    if (badges.length > 0) {
      return <div className="flex flex-wrap gap-2 mt-2">{badges}</div>
    } else {
      return null
    }
  }

  /**
   * Renders a diagram if provided.
   */
  function renderDiagram(diagramUrl?: string) {
    if (!diagramUrl) return null
    return (
      <div className="relative w-full max-w-xl mx-auto mb-4">
        <Image
          src={diagramUrl}
          alt="Question diagram"
          width={800}
          height={600}
          className="rounded-md w-full h-auto object-contain"
        />
      </div>
    )
  }

  /**
   * Renders the question input (MCQ or numeric) using
   * the existing onAnswer from the mock exam.
   */
  function renderAnswerUI(q: QuestionType) {
    const lowerType = (q.type || "").toLowerCase()

    // If MCQ
    if (lowerType.includes("mcq") || lowerType === "multiple choice") {
      if (!q.options) return null
      return (
        <div className="flex flex-col space-y-2 mt-4">
          {Object.entries(q.options).map(([key, optionText]) => {
            const isSelected = answers[currentQuestion] === key

            return (
              <button
                type="button"
                key={key}
                onClick={() => onAnswer(key)}
                className={`
                  text-left border rounded p-3
                  transition-colors
                  ${
                    isSelected
                      ? "bg-blue-50 border-blue-400 text-blue-800"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <span className="font-semibold mr-2">{key}.</span>
                {optionText.startsWith("http") ? (
                  <Image
                    src={optionText}
                    alt={`Option ${key}`}
                    width={400}
                    height={300}
                    className="rounded-md w-full h-auto object-contain mt-2"
                  />
                ) : (
                  <MathRenderer text={optionText} />
                )}
              </button>
            )
          })}
        </div>
      )
    }

    // If numeric
    if (lowerType.includes("num") || lowerType.includes("int")) {
      const val = answers[currentQuestion] || ""
      return (
        <div className="mt-4">
          <Input
            type="text"
            value={val}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Enter your numeric answer..."
            className="border-blue-400 bg-blue-50 text-blue-800"
          />
        </div>
      )
    }

    return (
      <p className="text-sm text-red-500 mt-4">
        Unknown question type: <strong>{q.type}</strong>.  
        Cannot render input here.
      </p>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* HEADER (unchanged) */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Left: user info */}
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

          {/* Right: timer + exit */}
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
      </header>

      {/* MAIN content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr,auto] md:gap-6">
        {/* LEFT: question content */}
        <section
          className="
            p-4 sm:p-6 lg:p-8 
            overflow-y-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-track]:bg-neutral-700
            dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
          "
        >
          {/* QUESTION BLOCK, styled similarly to `Question.tsx` */}
          <div
            className={`
              max-w-4xl mx-auto w-full mb-6 p-6 rounded-md 
              bg-white dark:bg-gray-800
              ${getQuestionBorderClass(questionStatuses[currentQuestion])}
            `}
          >
            {/* Title row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <h2 className="font-normal text-2xl sm:text-3xl">
                Question {currentQuestion + 1}
              </h2>
              {/* Render meta badges (subject, difficulty, etc.) */}
              {renderQuestionMeta(question)}
            </div>

            {/* Question text & diagram */}
            <div className="mt-4">
              {renderDiagram(question.diagramUrl)}

              {question.text && (
                <div className="latex-font text-base sm:text-lg md:text-xl leading-7 mb-4 text-gray-700">
                  <MathRenderer text={question.text} />
                </div>
              )}

              {/* Answer UI (MCQ or numeric, etc.) */}
              {renderAnswerUI(question)}
            </div>
          </div>

          {/* NAV + ACTION BUTTONS */}
          <div className="max-w-4xl mx-auto w-full">
            {/* Prev / Next / Clear / Mark for Review / Save & Next */}
            <div className="flex flex-wrap gap-3 justify-between w-full mb-4">
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

            {/* Submit Exam */}
            <div className="flex justify-center">
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
        </section>

        {/* SEPARATOR on mobile */}
        <Separator orientation="horizontal" className="block md:hidden" />

        {/* RIGHT: question status & navigator (unchanged) */}
        <aside className="md:w-[280px] bg-background p-4 space-y-6 border-l hidden md:block">
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Status</h3>
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
          </div>

          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Navigator</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, index) => {
                  const status = questionStatuses[index] || "notVisited"
                  const isCurrent = currentQuestion === index

                  let btnClasses = "w-10 h-10 p-0 font-medium text-sm"
                  if (isCurrent) {
                    btnClasses += " border-blue-800 bg-blue-100 text-blue-600"
                  } else if (status === "markedForReview") {
                    btnClasses += " border-blue-600 bg-blue-100 text-blue-600"
                  } else if (status === "notAnswered") {
                    btnClasses += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  } else if (status === "answered") {
                    btnClasses += " border-green-600 bg-green-100 text-green-600"
                  } else {
                    btnClasses += " border-gray-300 bg-white text-gray-600"
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={btnClasses}
                            onClick={() => onNavigate(index)}
                          >
                            {index + 1}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{status}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* On mobile: show the status/navigator below the question */}
        <div className="block md:hidden p-4 border-t space-y-6">
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Status</h3>
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
          </div>

          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Navigator</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, index) => {
                  const status = questionStatuses[index] || "notVisited"
                  const isCurrent = currentQuestion === index

                  let btnClasses = "w-10 h-10 p-0 font-medium text-sm"
                  if (isCurrent) {
                    btnClasses += " border-blue-800 bg-blue-100 text-blue-600"
                  } else if (status === "markedForReview") {
                    btnClasses += " border-blue-600 bg-blue-100 text-blue-600"
                  } else if (status === "notAnswered") {
                    btnClasses += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  } else if (status === "answered") {
                    btnClasses += " border-green-600 bg-green-100 text-green-600"
                  } else {
                    btnClasses += " border-gray-300 bg-white text-gray-600"
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={btnClasses}
                            onClick={() => onNavigate(index)}
                          >
                            {index + 1}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{status}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

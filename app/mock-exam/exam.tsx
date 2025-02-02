"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Clock, AlertCircle, CheckCircle, Flag, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"

// Import your KaTeX-based math renderer
import MathRenderer from "@/components/layout/MathRenderer"

// Single source-of-truth question type from exam-helpers
import type { QuestionType } from "@/lib/exam-helpers"

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
 * A responsive exam layout:
 * - On mobile (below lg): question on top, navigator below (stacked).
 * - On desktop (lg+): question left, navigator right (two columns).
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
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // The current question to display
  const question = filteredQuestions[currentQuestion]
  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">No question available. Please restart the exam.</p>
        <Button onClick={onExit}>Exit</Button>
      </div>
    )
  }

  // If the question has a diagram
  function renderDiagram(diagramUrl?: string) {
    if (!diagramUrl) return null
    return (
      <div className="relative w-full h-64 mb-4">
        <Image
          src={diagramUrl || "/placeholder.svg"}
          alt="Question diagram"
          fill
          style={{ objectFit: "contain" }}
          className="rounded-md"
        />
      </div>
    )
  }

  // MCQ or Numeric
  function renderQuestionBody(q: QuestionType) {
    const lower = (q.type || "").toLowerCase()

    // if type is "mcq", "mcqm", or "multiple choice"
    if (lower.includes("mcq") || lower === "multiple choice") {
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
    // if type is "numerical", "integer", etc.
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
    } else {
      // fallback
      return <p className="text-red-500">Unknown question type: {q.type}. Cannot render.</p>
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with user info, timer, exit */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* left side: user info */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedSubject} ({selectedYear}) - {selectedLevel}
              </p>
            </div>
          </div>
          {/* right side: timer + exit */}
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(examTimeLeft)}
            </div>
            <Button variant="ghost" size="icon" onClick={onExit}>
              <LogOut className="h-[1.2rem] w-[1.2rem] text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: question content */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Card className="mb-6 max-w-4xl mx-auto w-full bg-white dark:bg-gray-800 shadow-md">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-gray-900 dark:text-gray-100">
                <span>Question {currentQuestion + 1}</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {currentQuestion + 1} of {filteredQuestions.length}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              {renderDiagram(question.diagramUrl)}

              <div className="text-gray-700 dark:text-gray-300 mb-4 text-base sm:text-lg md:text-xl leading-7">
                <MathRenderer text={question.text} />
              </div>

              {renderQuestionBody(question)}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              {/* Nav buttons */}
              <div className="flex flex-wrap gap-3 justify-between w-full">
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
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 py-2 text-lg font-light bg-blue-500 hover:bg-blue-600 text-white"
            >
              Submit Exam
            </Button>
          </div>
        </div>

        {/* RIGHT: question navigator and status */}
        <div className="w-full lg:w-80 bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Question Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
                    Not Visited
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {questionStatusCounts.notVisited}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    Not Answered
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {questionStatusCounts.notAnswered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Answered
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{questionStatusCounts.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Flag className="w-4 h-4 mr-2 text-blue-500" />
                    Marked for Review
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {questionStatusCounts.markedForReview}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Question Navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, index) => {
                  const status = questionStatuses[index] || "notVisited"
                  const isCurrent = currentQuestion === index

                  let buttonClasses = "w-10 h-10 p-0 font-medium"
                  if (isCurrent) {
                    buttonClasses +=
                      " border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-200"
                  } else if (status === "markedForReview") {
                    buttonClasses +=
                      " border-yellow-500 bg-yellow-100 text-yellow-700 dark:border-yellow-400 dark:bg-yellow-900 dark:text-yellow-200"
                  } else if (status === "notAnswered") {
                    buttonClasses +=
                      " border-red-500 bg-red-100 text-red-700 dark:border-red-400 dark:bg-red-900 dark:text-red-200"
                  } else if (status === "answered") {
                    buttonClasses +=
                      " border-green-500 bg-green-100 text-green-700 dark:border-green-400 dark:bg-green-900 dark:text-green-200"
                  } else {
                    buttonClasses +=
                      " border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={buttonClasses}
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


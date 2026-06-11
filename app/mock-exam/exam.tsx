/* ------------------------------------------------------------------
   exam.tsx  -  light-only version
-------------------------------------------------------------------*/
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

import MathRenderer from "@/components/layout/MathRenderer"
import {
  QuestionType,
  encodeMultiAnswer,
  parseMultiAnswer,
} from "@/lib/exam-helpers"

/* ---------------------------------------------------------------
   helpers
---------------------------------------------------------------- */
function getQuestionBorderClass(status: string) {
  switch (status) {
    case "markedForReview":
      return "border-[3px] border-orange-300/70"
    case "answered":
      return "border-[3px] border-green-300/70"
    case "notAnswered":
      return "border-[3px] border-red-300/70"
    default:
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

  onAnswer:        (answer: string) => void
  onNext:          () => void
  onPrevious:      () => void
  onClear:         () => void
  onReviewAndNext: () => void
  onSaveAndNext:   () => void
  onSubmit:        () => void
  onExit:          () => void
  onNavigate:      (index: number) => void

  userName:        string
  selectedSubject: string
  selectedYear:    string
  selectedLevel:   string
}

/* ===============================================================
   main component
================================================================ */
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
  /* ---------- timer ---------- */
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  /* ---------- current question ---------- */
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

  /* ---------- meta pills ---------- */
  function renderQuestionMeta(q: QuestionType) {
    const pills: React.ReactNode[] = []

    if (q.subject)
      pills.push(
        <span key="subject" className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
          {q.subject}
        </span>
      )
    if (q.difficulty)
      pills.push(
        <span key="difficulty" className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
          {q.difficulty}
        </span>
      )
    if (typeof q.year === "number")
      pills.push(
        <span key="year" className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
          {q.year}
        </span>
      )
    if (q.type)
      pills.push(
        <span key="type" className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
          {q.type}
        </span>
      )
    if (q.exam)
      pills.push(
        <span key="exam" className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
          {q.exam}
        </span>
      )

    return pills.length ? <div className="flex flex-wrap gap-2 mt-2">{pills}</div> : null
  }

  /* ---------- diagram ---------- */
  const renderDiagram = (url?: string) =>
    url ? (
      <div className="relative w-full max-w-xl mx-auto mb-4">
        <Image
          src={url}
          alt="Question diagram"
          width={800}
          height={600}
          className="rounded-md w-full h-auto object-contain"
        />
      </div>
    ) : null

  /* ---------- option button (shared by MCQ & Multiple Correct) ---------- */
  function renderOptionButton(
    key: string,
    text: string,
    isSelected: boolean,
    onClick: () => void,
    marker: "radio" | "checkbox"
  ) {
    return (
      <button
        type="button"
        key={key}
        onClick={onClick}
        className={`flex items-start gap-3 text-left border rounded p-3 transition-colors ${
          isSelected
            ? "bg-blue-50 border-blue-400 text-blue-800"
            : "bg-white border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
            marker === "radio" ? "rounded-full" : "rounded"
          } ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-400"}`}
        >
          {isSelected ? (marker === "radio" ? "•" : "✓") : ""}
        </span>
        <span className="font-semibold">{key}.</span>
        {text?.startsWith("http") ? (
          <Image
            src={text}
            alt={`Option ${key}`}
            width={400}
            height={300}
            className="rounded-md w-full h-auto object-contain"
          />
        ) : (
          <MathRenderer text={text} />
        )}
      </button>
    )
  }

  /* ---------- answer UI (all five types) ---------- */
  function renderAnswerUI(q: QuestionType) {
    const current = answers[currentQuestion]

    switch (q.type) {
      case "Multiple Choice":
        return (
          <div className="flex flex-col space-y-2 mt-4">
            {Object.entries(q.options).map(([key, text]) =>
              renderOptionButton(
                key,
                text,
                current === key,
                () => onAnswer(key),
                "radio"
              )
            )}
          </div>
        )

      case "Multiple Correct": {
        const selected = parseMultiAnswer(current)
        return (
          <div className="flex flex-col space-y-2 mt-4">
            <p className="text-xs text-gray-500">Select all correct options.</p>
            {Object.entries(q.options).map(([key, text]) => {
              const isSelected = selected.includes(key)
              return renderOptionButton(
                key,
                text,
                isSelected,
                () =>
                  onAnswer(
                    encodeMultiAnswer(
                      isSelected
                        ? selected.filter((l) => l !== key)
                        : [...selected, key]
                    )
                  ),
                "checkbox"
              )
            })}
          </div>
        )
      }

      case "Integer":
        return (
          <div className="mt-4">
            <Input
              type="text"
              inputMode="numeric"
              value={current || ""}
              onChange={(e) => onAnswer(e.target.value.replace(/[^0-9-]/g, ""))}
              placeholder="Enter an integer..."
              className="border-blue-400 bg-blue-50 text-blue-800"
            />
          </div>
        )

      case "Numerical":
        return (
          <div className="mt-4">
            <Input
              type="text"
              inputMode="decimal"
              value={current || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Enter your numeric answer..."
              className="border-blue-400 bg-blue-50 text-blue-800"
            />
          </div>
        )

      case "Subjective":
        return (
          <div className="mt-4">
            <Textarea
              value={current || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Write your answer..."
              rows={5}
              className="border-blue-400 bg-blue-50 text-blue-800"
            />
            <p className="mt-1 text-xs text-gray-500">
              Subjective answers are saved for self-review and not auto-scored.
            </p>
          </div>
        )

      default:
        return (
          <p className="text-sm text-red-500 mt-4">
            Unknown question type: <strong>{q.type}</strong>.
          </p>
        )
    }
  }

  /* =============================================================
     render
  ============================================================= */
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* user info */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-medium">{userName}</h2>
              <p className="text-xs text-gray-500">
                {selectedSubject} ({selectedYear}) - {selectedLevel}
              </p>
            </div>
          </div>

          {/* timer + exit */}
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

      {/* ---------- main grid ---------- */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr,auto] md:gap-6">
        {/* ----------------------------------
            LEFT  – question & controls
        -----------------------------------*/}
        <section
          className="p-4 sm:p-6 lg:p-8 overflow-y-auto
                     [&::-webkit-scrollbar]:w-2
                     [&::-webkit-scrollbar-track]:rounded-full
                     [&::-webkit-scrollbar-track]:bg-gray-100
                     [&::-webkit-scrollbar-thumb]:rounded-full
                     [&::-webkit-scrollbar-thumb]:bg-gray-300"
        >
          {/* question card */}
          <div
            className={`max-w-4xl mx-auto w-full mb-6 p-6 rounded-md bg-white ${getQuestionBorderClass(
              questionStatuses[currentQuestion]
            )}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <h2 className="font-normal text-2xl sm:text-3xl">
                Question {currentQuestion + 1}
              </h2>
              {renderQuestionMeta(question)}
            </div>

            <div className="mt-4">
              {renderDiagram(question.diagramUrl)}

              {question.text && (
                <div className="latex-font text-base sm:text-lg md:text-xl leading-7 mb-4 text-gray-700">
                  <MathRenderer text={question.text} />
                </div>
              )}

              {renderAnswerUI(question)}
            </div>
          </div>

          {/* navigation / actions */}
          <div className="max-w-4xl mx-auto w-full">
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
                <Button onClick={onClear}          variant="outline">Clear</Button>
                <Button onClick={onReviewAndNext} variant="outline">Mark for Review & Next</Button>
                <Button onClick={onSaveAndNext}   variant="outline">Save & Next</Button>
              </div>
            </div>

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

        {/* mobile separator */}
        <Separator orientation="horizontal" className="block md:hidden" />

        {/* ----------------------------------
            RIGHT – status & navigator
        -----------------------------------*/}
        <aside className="md:w-[280px] bg-white p-4 space-y-6 border-l hidden md:block">
          {/* status */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Status</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
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

          {/* navigator */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Navigator</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, idx) => {
                  const status   = questionStatuses[idx] || "notVisited"
                  const isCurrent = currentQuestion === idx

                  let cls = "w-10 h-10 p-0 font-medium text-sm"
                  if (isCurrent)                cls += " border-blue-800 bg-blue-100 text-blue-600"
                  else if (status === "markedForReview") cls += " border-blue-600 bg-blue-100 text-blue-600"
                  else if (status === "notAnswered")     cls += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  else if (status === "answered")        cls += " border-green-600 bg-green-100 text-green-600"
                  else                                   cls += " border-gray-300 bg-white text-gray-600"

                  return (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={cls}
                            onClick={() => onNavigate(idx)}
                          >
                            {idx + 1}
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

        {/* ---------- mobile: status + navigator underneath ---------- */}
        <div className="block md:hidden p-4 border-t space-y-6">
          {/* re-use same markup as desktop but smaller */}
          {/* status */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Status</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
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

          {/* navigator */}
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Question Navigator</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((_, idx) => {
                  const status   = questionStatuses[idx] || "notVisited"
                  const isCurrent = currentQuestion === idx

                  let cls = "w-10 h-10 p-0 font-medium text-sm"
                  if (isCurrent)                cls += " border-blue-800 bg-blue-100 text-blue-600"
                  else if (status === "markedForReview") cls += " border-blue-600 bg-blue-100 text-blue-600"
                  else if (status === "notAnswered")     cls += " border-yellow-600 bg-yellow-100 text-yellow-600"
                  else if (status === "answered")        cls += " border-green-600 bg-green-100 text-green-600"
                  else                                   cls += " border-gray-300 bg-white text-gray-600"

                  return (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className={cls}
                            onClick={() => onNavigate(idx)}
                          >
                            {idx + 1}
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

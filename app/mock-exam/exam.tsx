/* ------------------------------------------------------------------
   exam.tsx — the CBT hall, in the desk design system.
   Presentational only; all state/handlers come from mock-exam.tsx.
-------------------------------------------------------------------*/
"use client"

import React from "react"
import { isImageSrc } from "@/lib/is-image-src"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Flag,
  Check,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import Image from "next/image"

import MathRenderer from "@/components/layout/MathRenderer"
import { OmrBubble, type OmrStatus } from "@/components/desk"
import {
  QuestionType,
  encodeMultiAnswer,
  parseMultiAnswer,
} from "@/lib/exam-helpers"

/* ---------------------------------------------------------------
   helpers
---------------------------------------------------------------- */
/** Map the exam's internal status keys onto the CBT/OMR legend. */
function toOmrStatus(status: string): OmrStatus {
  switch (status) {
    case "answered":
      return "answered"
    case "markedForReview":
      return "review"
    case "notAnswered":
      return "unanswered"
    default:
      return "notvisited"
  }
}

const STATUS_LABELS: { key: string; omr: OmrStatus; label: string }[] = [
  { key: "answered", omr: "answered", label: "Answered" },
  { key: "markedForReview", omr: "review", label: "Marked for review" },
  { key: "notAnswered", omr: "unanswered", label: "Not answered" },
  { key: "notVisited", omr: "notvisited", label: "Not visited" },
]

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
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const mm = m.toString().padStart(2, "0")
    const ss = s.toString().padStart(2, "0")
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }
  // Last five minutes: the timer writes in the red pen. Colour only, no motion.
  const timeCritical = examTimeLeft <= 5 * 60

  const total = filteredQuestions.length
  const examTitle =
    [selectedSubject, selectedYear, selectedLevel].filter(Boolean).join(" · ") ||
    "Mock exam"

  /* ---------- current question ---------- */
  const question = filteredQuestions[currentQuestion]
  if (!question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4 text-center text-pencil">
          No question available. Please restart the exam.
        </p>
        <Button onClick={onExit}>Exit</Button>
      </div>
    )
  }

  const currentStatus = questionStatuses[currentQuestion] || "notVisited"

  /* ---------- diagram ---------- */
  const renderDiagram = (url?: string) =>
    url ? (
      <div className="relative mx-auto mb-5 w-full max-w-xl">
        <Image
          src={url}
          alt="Question diagram"
          width={800}
          height={600}
          className="h-auto w-full rounded-md border border-rule object-contain"
        />
      </div>
    ) : null

  /* ---------- option row (shared by MCQ & Multiple Correct) ---------- */
  function renderOptionButton(
    key: string,
    text: string,
    isSelected: boolean,
    onClick: () => void
  ) {
    return (
      <button
        type="button"
        key={key}
        onClick={onClick}
        className="omr-option min-h-11"
        data-state={isSelected ? "selected" : undefined}
        aria-pressed={isSelected}
      >
        <OmrBubble filled={isSelected} className="mt-0.5">
          {key}
        </OmrBubble>
        {isImageSrc(text) ? (
          <Image
            src={text}
            alt={`Option ${key}`}
            width={400}
            height={300}
            className="h-auto w-full rounded-md object-contain"
          />
        ) : (
          <span className="latex-font text-base leading-7 sm:text-lg">
            <MathRenderer text={text} />
          </span>
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
          <div className="flex flex-col space-y-1.5" role="group" aria-label="Answer options">
            {Object.entries(q.options).map(([key, text]) =>
              renderOptionButton(key, text, current === key, () => onAnswer(key))
            )}
          </div>
        )

      case "Multiple Correct": {
        const selected = parseMultiAnswer(current)
        return (
          <div className="flex flex-col space-y-1.5" role="group" aria-label="Answer options — choose all that apply">
            {Object.entries(q.options).map(([key, text]) => {
              const isSelected = selected.includes(key)
              return renderOptionButton(key, text, isSelected, () =>
                onAnswer(
                  encodeMultiAnswer(
                    isSelected
                      ? selected.filter((l) => l !== key)
                      : [...selected, key]
                  )
                )
              )
            })}
          </div>
        )
      }

      case "Integer":
        return (
          <Input
            type="text"
            inputMode="numeric"
            value={current || ""}
            onChange={(e) => onAnswer(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="Your integer answer"
            className="type-data h-12 w-full max-w-xs bg-paper text-lg"
          />
        )

      case "Numerical":
        return (
          <Input
            type="text"
            inputMode="decimal"
            value={current || ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Your numeric answer"
            className="type-data h-12 w-full max-w-xs bg-paper text-lg"
          />
        )

      case "Subjective":
        return (
          <div>
            <Textarea
              value={current || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Write your answer"
              rows={6}
              className="latex-font bg-paper"
            />
            <p className="mt-1.5 text-xs text-pencil">
              Subjective answers are saved for self-review and not auto-scored.
            </p>
          </div>
        )

      default:
        return (
          <p className="text-sm text-redpen">
            Unknown question type: <strong>{q.type}</strong>.
          </p>
        )
    }
  }

  /* ---------- the question palette (shared desktop/mobile) ---------- */
  function Palette() {
    return (
      <div className="grid grid-cols-6 gap-2 md:grid-cols-5">
        {filteredQuestions.map((_, idx) => {
          const status = questionStatuses[idx] || "notVisited"
          const isCurrent = currentQuestion === idx
          return (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onNavigate(idx)}
                    aria-label={`Question ${idx + 1}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`flex min-h-11 items-center justify-center rounded-md transition-colors hover:bg-secondary ${
                      isCurrent ? "ring-2 ring-ballpoint ring-offset-2 ring-offset-paper" : ""
                    }`}
                  >
                    <OmrBubble status={toOmrStatus(status)} className="h-9 w-9">
                      {idx + 1}
                    </OmrBubble>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {STATUS_LABELS.find((s) => s.key === status)?.label ?? "Not visited"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    )
  }

  function LegendRow() {
    const counts: Record<string, number> = {
      answered: questionStatusCounts.answered,
      markedForReview: questionStatusCounts.markedForReview,
      notAnswered: questionStatusCounts.notAnswered,
      notVisited: questionStatusCounts.notVisited,
    }
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {STATUS_LABELS.map(({ key, omr, label }) => (
          <span key={key} className="flex items-center gap-2 text-xs text-pencil">
            <OmrBubble status={omr} className="h-4 w-4 border">
              {""}
            </OmrBubble>
            <span className="type-data text-ink">{counts[key]}</span>
            {label}
          </span>
        ))}
      </div>
    )
  }

  const submitPaper = () => {
    if (window.confirm("Submit the paper? You can't change answers after this.")) {
      onSubmit()
    }
  }

  /* =============================================================
     render — fixed app frame: masthead + scrollable paper + rail
  ============================================================= */
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-desk">
      {/* ---------- masthead ---------- */}
      <header className="z-10 shrink-0 border-b border-rule bg-paper">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* candidate */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule bg-secondary">
              <User className="h-5 w-5 text-pencil" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-ink">{userName}</h2>
              <p className="type-data truncate text-xs text-pencil">{examTitle}</p>
            </div>
          </div>

          {/* timer + exit */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="type-data text-[10px] uppercase tracking-[0.14em] text-pencil">
                Time left
              </p>
              <p
                role="timer"
                aria-live={timeCritical ? "polite" : "off"}
                className={`type-data text-lg font-medium tabular-nums ${
                  timeCritical ? "text-redpen" : "text-ink"
                }`}
              >
                {formatTime(examTimeLeft)}
              </p>
            </div>
            <div
              className={`type-data flex items-center rounded-md border px-3 py-1.5 text-sm sm:hidden ${
                timeCritical ? "border-redpen text-redpen" : "border-rule text-ink"
              }`}
            >
              <Clock className="mr-1.5 h-4 w-4" />
              {formatTime(examTimeLeft)}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onExit} className="h-11 w-11">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Exit exam</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exit exam</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* ---------- body ---------- */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* LEFT — question paper (scrolls) */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="paper-sheet mx-auto w-full max-w-4xl p-5 sm:p-7">
              {/* question header */}
              <div className="flex items-center justify-between gap-3 border-b border-rule pb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="type-display text-2xl text-ink sm:text-3xl">
                    Q{currentQuestion + 1}
                  </h2>
                  <span className="type-data text-sm text-pencil">of {total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentStatus === "markedForReview" && (
                    <span className="flex items-center gap-1 type-data text-xs text-st-review">
                      <Flag className="h-3.5 w-3.5 fill-st-review" />
                      For review
                    </span>
                  )}
                  {question.type && (
                    <span className="rounded-md border border-rule bg-secondary px-2 py-0.5 type-data text-xs text-pencil">
                      {question.type}
                    </span>
                  )}
                </div>
              </div>

              {/* question body */}
              <div className="mt-5">
                {renderDiagram(question.diagramUrl)}
                {question.text && (
                  <div className="latex-font mb-6 max-w-[70ch] text-base leading-8 text-ink sm:text-lg">
                    <MathRenderer text={question.text} />
                  </div>
                )}
                {renderAnswerUI(question)}
              </div>
            </div>
          </div>

          {/* sticky action bar */}
          <div className="shrink-0 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  size="sm"
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={onNext}
                  variant="outline"
                  size="sm"
                  disabled={currentQuestion === total - 1}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button onClick={onClear} variant="ghost" size="sm" className="text-pencil">
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={onReviewAndNext} variant="outline" size="sm">
                  <Flag className="mr-1.5 h-4 w-4" />
                  Review &amp; next
                </Button>
                <Button onClick={onSaveAndNext} size="sm">
                  <Check className="mr-1.5 h-4 w-4" />
                  Save &amp; next
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — answer-sheet rail (desktop) */}
        <aside className="hidden w-80 shrink-0 flex-col border-l border-rule bg-paper md:flex">
          <div className="border-b border-rule p-4">
            <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
              Answer sheet
            </p>
            <p className="mt-1 text-sm text-pencil">
              <span className="type-data text-ink">{questionStatusCounts.answered}</span>{" "}
              of <span className="type-data text-ink">{total}</span> answered
            </p>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
            <Palette />
          </div>
          <div className="space-y-4 border-t border-rule p-4">
            <LegendRow />
            <Button
              onClick={submitPaper}
              className="w-full bg-redpen text-paper hover:bg-redpen/90"
            >
              Submit paper
            </Button>
          </div>
        </aside>

        {/* mobile: palette + legend + submit underneath */}
        <div className="space-y-4 border-t border-rule bg-paper p-4 md:hidden">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
            Answer sheet
          </p>
          <Palette />
          <LegendRow />
          <Button
            onClick={submitPaper}
            className="w-full bg-redpen text-paper hover:bg-redpen/90"
          >
            Submit paper
          </Button>
        </div>
      </div>
    </div>
  )
}

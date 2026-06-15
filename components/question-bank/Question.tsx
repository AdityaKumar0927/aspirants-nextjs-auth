"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { encodeMultiAnswer } from "@/lib/exam-helpers"
import { isImageSrc } from "@/lib/is-image-src"
import { useSwipeable } from "react-swipeable"
import MathRenderer from "@/components/layout/MathRenderer"
import Image from "next/image"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Flag, X, Check, CheckCircle2, XCircle, Tag } from "@/components/desk/icons"
import FeedbackPopover from "./FeedbackPopover"

// If you have your Tiptap-based discussion
import { QuestionSolutions } from "./QuestionSolutions"

/* ------------------------------------------------------------------
   Question metadata header helpers
   ------------------------------------------------------------------ */
/** Metadata chip colour by kind — distinct, on-brand, no yellow. */
const TAG_TONE = {
  subject: "border-ballpoint/25 bg-ballpoint/10 text-ballpoint",
  type: "border-st-review/30 bg-st-review/10 text-st-review",
  exam: "border-ink/20 bg-ink/[0.06] text-ink",
  year: "border-rule bg-secondary text-pencil",
  neutral: "border-rule bg-secondary text-pencil",
} as const

/** Difficulty colour: easy = green, medium = orange (not yellow), hard = red pen. */
const DIFFICULTY_TONE: Record<string, string> = {
  easy: "border-st-answered/30 bg-st-answered/10 text-st-answered",
  medium: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  hard: "border-redpen/30 bg-redpen/10 text-redpen",
}

/** "jee-main" -> "JEE MAIN" (exam codes read better in caps). */
function formatExam(exam: string): string {
  return exam.replace(/[-_]/g, " ").toUpperCase()
}

/** A bordered metadata chip, tinted by kind. */
function MetaTag({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TAG_TONE
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${TAG_TONE[tone] ?? TAG_TONE.neutral}`}
    >
      {children}
    </span>
  )
}

/**
 * The option marker — a rounded SQUARE letter tile (not an OMR circle). Inks
 * to ballpoint when selected; turns green/red after grading; "reveal" rings the
 * correct answer.
 */
function OptionMark({
  letter,
  selected = false,
  verdict,
}: {
  letter: string
  selected?: boolean
  verdict?: "correct" | "wrong" | "reveal"
}) {
  const cls =
    verdict === "correct"
      ? "border-st-answered bg-st-answered text-paper"
      : verdict === "wrong"
        ? "border-redpen bg-redpen text-paper"
        : verdict === "reveal"
          ? "border-st-answered text-st-answered"
          : selected
            ? "border-ballpoint bg-ballpoint text-paper"
            : "border-rule bg-paper text-pencil"
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border type-data text-sm font-medium transition-colors ${cls}`}
    >
      {letter}
    </span>
  )
}

/* ------------------------------------------------------------------
   1) Enums & Types
   ------------------------------------------------------------------ */
enum QuestionStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

type QuestionTypeString =
  | "Multiple Choice"
  | "mcq"
  | "Numerical"
  | "integer"
  | "Subjective"
  | "Mcqm"
  | "Fill Blanks"
  | "T/f"
  | string

interface QuestionType {
  id: number
  questionId?: string
  text?: string
  options?: string[]
  markscheme?: string
  explanation?: string
  correctOption?: string
  diagramUrl?: string
  exam?: string
  subject?: string
  topic?: string
  difficulty?: string
  year?: number
  type?: QuestionTypeString
  reviewed?: boolean
  completed?: boolean
  lastAttempted?: string
  status?: QuestionStatus
  customTags?: string[]
  difficultyRating?: number
}

interface QuestionProps {
  question: QuestionType

  feedback: string | undefined
  selectedOption: string | undefined
  numericalAnswer: string | undefined
  showMarkscheme: boolean | undefined

  handleOptionClick: (questionId: string, option: string, correctOption: string) => void
  handleNumericalSubmit: (questionId: string, userAnswer: string, correctAnswer: string) => void
  handleNumericalChange: (questionId: string, value: string) => void
  handleMarkschemeToggle: (questionId: string) => void
  handleMarkForReview: (questionId: string, newVal?: boolean) => void
  handleMarkComplete: (questionId: string, newVal?: boolean) => void
  handleResetQuestion: (questionId: string) => void

  isMarkedForReview: boolean
  isMarkedComplete: boolean
  markschemesDisabled: boolean

  totalQuestions: number
  currentQuestionIndex: number
  handleQuestionChange: (index: number) => void
  onNextQuestion?: () => void
  onPreviousQuestion?: () => void
}

/* ------------------------------------------------------------------
   2) Outline color logic
   ------------------------------------------------------------------ */
function getBorderClass(feedback: string | undefined, isMarkedForReview: boolean): string {
  // Verdict colors live inside the OMR bubbles/options, not on the card frame;
  // the sheet only signals "marked for review" via the CBT legend purple.
  if (isMarkedForReview) {
    return "border-l-[3px] border-l-st-review"
  }
  return ""
}

/* ------------------------------------------------------------------
   3) Main Question component
   ------------------------------------------------------------------ */
function Question({
  question,
  feedback,
  selectedOption,
  numericalAnswer,
  showMarkscheme,
  handleOptionClick,
  handleNumericalSubmit,
  handleNumericalChange,
  handleMarkschemeToggle,
  handleMarkForReview,
  handleMarkComplete,
  handleResetQuestion,
  isMarkedForReview,
  isMarkedComplete,
  markschemesDisabled,
  totalQuestions,
  currentQuestionIndex,
  handleQuestionChange,
  onNextQuestion,
  onPreviousQuestion,
}: QuestionProps) {
  const displayNumber = currentQuestionIndex + 1

  // For older MCQ
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(selectedOption || null)

  // Markscheme modal
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)

  // Additional question-type states
  const [mcqmSelections, setMcqmSelections] = useState<string[]>([])
  const [fillBlanksInput, setFillBlanksInput] = useState<string>("")
  const [subjectiveAnswer, setSubjectiveAnswer] = useState<string>("")

  // Tagging
  const [newTag, setNewTag] = useState("")
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])

  // Difficulty
  const [localDifficultyRating, setLocalDifficultyRating] = useState<number | undefined>(
    question.difficultyRating
  )

  // Toast
  const { toast } = useToast()

  // Swipe
  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  // Expandable discussion
  const [showDiscussion, setShowDiscussion] = useState(false)

  // Keep localSelectedOption in sync
  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  /* ------------------------------
     Tag logic
     ------------------------------ */
  async function handleAddTag() {
    if (!newTag || !question.questionId) return
    if (localCustomTags.includes(newTag)) {
      // Show success or error? It's "already added," might do an error toast
      toast({
        title: "Notice",
        description: "Tag already added",
        variant: "destructive", // red-styled
      })
      return
    }
    const updated = [...localCustomTags, newTag]
    setLocalCustomTags(updated)
    setNewTag("")

    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          customTags: updated,
        }),
      })
      // Show success toast with green style
      toast({
        title: "Tag Added",
        description: `“${newTag}” was added successfully.`,
        // We'll do a custom "success" variant, if your toast system supports it:
        variant: "success", 
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not add custom tag. Check logs.",
        variant: "destructive",
      })
    }
  }

  async function handleRemoveTag(tag: string) {
    if (!question.questionId) return
    const updated = localCustomTags.filter((t) => t !== tag)
    setLocalCustomTags(updated)

    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          customTags: updated,
        }),
      })
      // Another success toast
      toast({
        title: "Tag Removed",
        description: `“${tag}” was removed successfully.`,
        variant: "success",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not remove custom tag. Check logs.",
        variant: "destructive",
      })
    }
  }

  /* ------------------------------
     Mark Complete & Flag
     ------------------------------ */
  async function toggleComplete(checked: boolean) {
    if (!question.questionId) return
    const qid = question.questionId
    await handleMarkComplete(qid, checked)
    if (checked) {
      toast({
        title: "Marked complete",
        description: `Question #${displayNumber} saved to your progress.`,
        variant: "success",
        // Undo calls the setter directly with the reverted value, so it never
        // depends on stale state captured in this closure.
        action: (
          <ToastAction altText="Undo marking complete" onClick={() => handleMarkComplete(qid, false)}>
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Marked incomplete",
        description: `Question #${displayNumber} removed from your progress.`,
      })
    }
  }

  async function toggleReview() {
    if (!question.questionId) return
    const qid = question.questionId
    const newVal = !isMarkedForReview
    await handleMarkForReview(qid, newVal)
    if (newVal) {
      toast({
        title: "Flagged for review",
        description: `Question #${displayNumber} added to your review list.`,
        variant: "review",
        action: (
          <ToastAction altText="Remove review flag" onClick={() => handleMarkForReview(qid, false)}>
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Flag removed",
        description: `Question #${displayNumber} cleared from review.`,
      })
    }
  }

  /* ------------------------------
     MCQ logic
     ------------------------------ */
  function handleOptionSelect(letter: string) {
    setPendingOption(letter)
  }
  async function handleMcqSubmit() {
    if (!pendingOption || !question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, pendingOption, question.correctOption ?? "N/A")
    setLocalSelectedOption(pendingOption)
  }
  function cleanOptionText(option: string): string {
    // Remove "A: " prefix etc.
    return option.replace(/^[A-D]:\s?/i, "").trim()
  }

  /* ------------------------------
     Numerical logic
     ------------------------------ */
  async function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    await handleNumericalSubmit(
      question.questionId,
      numericalAnswer ?? "",
      question.correctOption ?? "N/A"
    )
  }

  /* ------------------------------
     MCQM logic
     ------------------------------ */
  function handleMcqmToggle(letter: string) {
    setMcqmSelections((prev) =>
      prev.includes(letter) ? prev.filter((x) => x !== letter) : [...prev, letter]
    )
  }
  async function handleMcqmSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, encodeMultiAnswer(mcqmSelections), question.correctOption ?? "")
  }

  /* ------------------------------
     T/f logic
     ------------------------------ */
  const tfOptions = ["True", "False"]
  async function handleTfSubmit(answer: string) {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, answer, question.correctOption ?? "")
    setLocalSelectedOption(answer)
  }

  /* ------------------------------
     Fill Blanks
     ------------------------------ */
  async function handleFillBlanksSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleNumericalSubmit(question.questionId, fillBlanksInput, question.correctOption ?? "")
  }

  /* ------------------------------
     Subjective
     ------------------------------ */
  async function handleSubjectiveSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleNumericalSubmit(question.questionId, subjectiveAnswer, question.correctOption ?? "")
  }

  /* ------------------------------
     Difficulty rating
     ------------------------------ */
  function handleDifficultyChange(newRating: number) {
    if (!question.questionId) return
    // Personal/visual rating only. A question's difficulty is global content and
    // must not be overwritten for every user by a member action — so this no
    // longer PATCHes the shared Question row (it previously did, letting one
    // user change a question's difficulty for everyone).
    setLocalDifficultyRating(newRating)
  }

  /* ------------------------------
     Render
     ------------------------------ */
  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-20" id={`question-${question.questionId}`}>
        <Card
          className={`
            paper-sheet w-full overflow-hidden mb-6
            ${getBorderClass(feedback, isMarkedForReview)}
          `}
        >
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Title + metadata chips */}
              <div className="min-w-0">
                <CardTitle className="text-xl font-semibold sm:text-2xl">
                  Question #{displayNumber}
                </CardTitle>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {question.subject && <MetaTag tone="subject">{question.subject}</MetaTag>}
                  {question.difficulty && (
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
                        DIFFICULTY_TONE[question.difficulty.toLowerCase()] ?? TAG_TONE.neutral
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  )}
                  {typeof question.year === "number" && <MetaTag tone="year">{question.year}</MetaTag>}
                  {question.type && <MetaTag tone="type">{question.type}</MetaTag>}
                  {question.exam && <MetaTag tone="exam">{formatExam(question.exam)}</MetaTag>}

                  {/* Custom Tags */}
                  {localCustomTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md border border-ballpoint/40 bg-ballpoint/5 px-2 py-0.5 text-xs font-medium text-ballpoint"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="rounded-sm hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new tag */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
                    <Input
                      type="text"
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      className="h-9 w-44 bg-paper pl-8 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Mark complete & flag — labelled toggle buttons */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleComplete(!isMarkedComplete)}
                  aria-pressed={isMarkedComplete}
                  className={`flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isMarkedComplete
                      ? "border-st-answered bg-st-answered/10 text-st-answered"
                      : "border-rule bg-secondary text-pencil hover:border-st-answered/50 hover:text-ink"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {isMarkedComplete ? "Completed" : "Mark complete"}
                </button>

                <button
                  type="button"
                  onClick={toggleReview}
                  aria-pressed={isMarkedForReview}
                  className={`flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isMarkedForReview
                      ? "border-st-review bg-st-review/10 text-st-review"
                      : "border-rule bg-secondary text-pencil hover:border-st-review/50 hover:text-ink"
                  }`}
                >
                  <Flag className={`h-4 w-4 ${isMarkedForReview ? "fill-st-review" : ""}`} />
                  {isMarkedForReview ? "Flagged" : "Flag for review"}
                </button>

                {/* Feedback popover */}
                {question.questionId && <FeedbackPopover questionId={question.questionId} />}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Diagram + Text */}
            <div className="mb-6">
              {question.diagramUrl && (
                <div className="relative w-full max-w-xl mx-auto mb-4">
                  <Image
                    src={question.diagramUrl}
                    alt={`Diagram for question #${displayNumber}`}
                    width={800}
                    height={600}
                    className="rounded-md w-full h-auto object-contain"
                  />
                </div>
              )}
              {question.text && (
                <div className="latex-font mb-4 max-w-[70ch] text-base leading-7 sm:text-lg">
                  <MathRenderer text={question.text} />
                </div>
              )}
            </div>

            {/* MCQ */}
            {(question.type === "Multiple Choice" || question.type?.toLowerCase() === "mcq") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-1" role="group" aria-label="Answer options">
                    {question.options.map((rawOption, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const optionText = cleanOptionText(rawOption)
                      const isPending = pendingOption === letter
                      const directSelected = localSelectedOption === letter
                      const isFeedbackActive = directSelected && feedback
                      const verdict = isFeedbackActive
                        ? feedback === "correct"
                          ? ("correct" as const)
                          : ("wrong" as const)
                        : undefined

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOptionSelect(letter)}
                          className="omr-option min-h-11"
                          data-state={isPending || directSelected ? "selected" : undefined}
                          data-verdict={verdict}
                          aria-pressed={isPending || directSelected}
                        >
                          <OptionMark
                            letter={letter}
                            selected={isPending || directSelected}
                            verdict={verdict}
                          />
                          {isImageSrc(optionText) ? (
                            <div className="w-full">
                              <Image
                                src={optionText}
                                alt={`Option ${letter}`}
                                width={800}
                                height={600}
                                className="rounded-md w-full h-auto object-contain"
                              />
                            </div>
                          ) : (
                            <div
                              className={`latex-font text-base sm:text-lg leading-7 ${
                                verdict === "wrong" ? "ink-strike text-pencil" : ""
                              }`}
                            >
                              <MathRenderer text={optionText} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleMcqSubmit} disabled={!pendingOption}>
                      Check answer
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        question.questionId && handleResetQuestion(question.questionId)
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

            {/* Numerical */}
            {(question.type === "Numerical" ||
              question.type?.toLowerCase() === "numerical" ||
              question.type === "integer") && (
              <div className="mb-4">
                <Input
                  type="text"
                  inputMode="decimal"
                  className="type-data w-full max-w-xs"
                  placeholder="Your answer"
                  value={numericalAnswer ?? ""}
                  onChange={(e) => {
                    if (question.questionId) {
                      handleNumericalChange(question.questionId, e.target.value)
                    }
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleNumericalSubmitLocal}>Check answer</Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      question.questionId && handleResetQuestion(question.questionId)
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* MCQM */}
            {(question.type === "Mcqm" || question.type?.toLowerCase() === "mcqm") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <p className="type-data mb-2 text-[11px] uppercase tracking-[0.14em] text-pencil">
                    Choose all that apply
                  </p>
                  <div className="space-y-1" role="group" aria-label="Answer options — choose all that apply">
                    {question.options.map((rawOption, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const optionText = rawOption.trim()
                      const isChosen = mcqmSelections.includes(letter)

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleMcqmToggle(letter)}
                          className="omr-option min-h-11"
                          data-state={isChosen ? "selected" : undefined}
                          aria-pressed={isChosen}
                        >
                          <OptionMark letter={letter} selected={isChosen} />
                          {isImageSrc(optionText) ? (
                            <div className="w-full">
                              <Image
                                src={optionText}
                                alt={`Option ${letter}`}
                                width={800}
                                height={600}
                                className="rounded-md w-full h-auto object-contain"
                              />
                            </div>
                          ) : (
                            <div className="latex-font text-base sm:text-lg leading-7">
                              <MathRenderer text={optionText} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleMcqmSubmit} disabled={mcqmSelections.length === 0}>
                      Check answer
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        question.questionId && handleResetQuestion(question.questionId)
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

            {/* T/f */}
            {(question.type === "T/f" ||
              question.type?.toLowerCase() === "t/f" ||
              question.type?.toLowerCase() === "true/false") && (
              <div className="mb-4 flex items-center gap-2">
                {tfOptions.map((val) => {
                  const isActive = localSelectedOption === val && feedback
                  const verdict = isActive
                    ? feedback === "correct"
                      ? ("correct" as const)
                      : ("wrong" as const)
                    : undefined
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleTfSubmit(val)}
                      className="omr-option min-h-11 w-auto"
                      data-state={isActive ? "selected" : undefined}
                      data-verdict={verdict}
                      aria-pressed={!!isActive}
                    >
                      <OptionMark
                        letter={val === "True" ? "T" : "F"}
                        selected={!!isActive}
                        verdict={verdict}
                      />
                      <span className="latex-font text-base leading-7">{val}</span>
                    </button>
                  )
                })}
                <Button
                  variant="ghost"
                  onClick={() =>
                    question.questionId && handleResetQuestion(question.questionId)
                  }
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Fill Blanks */}
            {question.type?.toLowerCase() === "fill blanks" && (
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Fill in the blank"
                  value={fillBlanksInput}
                  onChange={(e) => setFillBlanksInput(e.target.value)}
                  className="latex-font w-full max-w-md mb-2"
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleFillBlanksSubmit}>Check answer</Button>
                  <Button
                    variant="ghost"
                    className="text-pencil"
                    onClick={() =>
                      question.questionId && handleResetQuestion(question.questionId)
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Subjective */}
            {question.type?.toLowerCase() === "subjective" && (
              <div className="mb-4">
                <div className="mb-2">
                  <label
                    htmlFor={`subjective-${question.questionId}`}
                    className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil"
                  >
                    Your answer
                  </label>
                </div>
                <textarea
                  id={`subjective-${question.questionId}`}
                  className="latex-font w-full rounded-md border border-rule bg-paper px-3 py-2 text-base leading-7 placeholder:text-pencil"
                  rows={4}
                  value={subjectiveAnswer}
                  onChange={(e) => setSubjectiveAnswer(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleSubjectiveSubmit}>Save answer</Button>
                  <Button
                    variant="ghost"
                    className="text-pencil"
                    onClick={() =>
                      question.questionId && handleResetQuestion(question.questionId)
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Verdict banner */}
            {feedback && (
              <div
                role="status"
                className={`mt-5 flex items-start gap-3 rounded-lg border p-4 ${
                  feedback === "correct"
                    ? "border-st-answered/30 bg-st-answered/10"
                    : "border-redpen/30 bg-redpen/10"
                }`}
              >
                <span className={feedback === "correct" ? "text-st-answered" : "text-redpen"}>
                  {feedback === "correct" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`font-medium ${
                      feedback === "correct" ? "text-st-answered" : "text-redpen"
                    }`}
                  >
                    {feedback === "correct" ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-0.5 text-sm text-pencil">
                    {feedback === "correct"
                      ? "Nicely done — that's the right answer."
                      : "Not quite — open the markscheme to see the working."}
                  </p>
                </div>
              </div>
            )}

            {/* Show Markscheme */}
            {markschemeEnabled && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMarkschemeModal(!showMarkschemeModal)
                    if (question.questionId) {
                      handleMarkschemeToggle(question.questionId)
                    }
                  }}
                >
                  {showMarkschemeModal ? "Hide markscheme" : "Show markscheme"}
                </Button>
              </div>
            )}

            {/* Difficulty dropdown */}
            <div className="flex items-center space-x-2 mt-4">
              <label className="text-sm text-pencil">My difficulty</label>
              <Select
                value={
                  localDifficultyRating === 1
                    ? "easy"
                    : localDifficultyRating === 2
                    ? "medium"
                    : localDifficultyRating === 3
                    ? "hard"
                    : ""
                }
                onValueChange={(val) => {
                  let rating = 1
                  if (val === "medium") rating = 2
                  if (val === "hard") rating = 3
                  handleDifficultyChange(rating)
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Set difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          {/* CardFooter with Discussion Toggle */}
          <CardFooter className="flex items-center justify-end">
            <Button variant="outline" onClick={() => setShowDiscussion(!showDiscussion)}>
              {showDiscussion ? "Hide" : "Discussion"}
            </Button>
          </CardFooter>

          {/* Expandable Discussion Section */}
          <AnimatePresence>
            {showDiscussion && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="counterfoil max-h-100 overflow-y-auto p-4">
                  <p className="type-data mb-2 text-[11px] uppercase tracking-[0.14em] text-pencil">
                    Discussion
                  </p>
                  {question.questionId ? (
                    <QuestionSolutions questionId={question.questionId} />
                  ) : (
                    <div className="text-xs text-pencil">No questionId found.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Markscheme (Explanation) Modal */}
        <AnimatePresence>
          {showMarkschemeModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
            >
              <Card className="paper-sheet w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Markscheme</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowMarkschemeModal(false)}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close markscheme</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Close markscheme</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {question.explanation
                      ? typeof question.explanation === "string" &&
                        isImageSrc(question.explanation) ? (
                          <div className="relative w-full max-w-lg mx-auto">
                            <Image
                              src={question.explanation}
                              alt="Explanation image"
                              width={800}
                              height={600}
                              className="rounded-md w-full h-auto object-contain"
                            />
                          </div>
                        ) : (
                          <div className="latex-font">
                            <MathRenderer text={String(question.explanation || "")} />
                          </div>
                        )
                      : question.markscheme
                      ? isImageSrc(question.markscheme) ? (
                          <div className="relative w-full max-w-lg mx-auto">
                            <Image
                              src={question.markscheme}
                              alt="Markscheme image"
                              width={800}
                              height={600}
                              className="rounded-md w-full h-auto object-contain"
                            />
                          </div>
                        ) : (
                          <div className="latex-font">
                            <MathRenderer text={question.markscheme} />
                          </div>
                        )
                      : "No explanation available"}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

// Memoized so unchanged questions in a large list don't re-render (each renders
// heavy MathRenderer/animation). Relies on the parent passing stable props.
export default React.memo(Question)

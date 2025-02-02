"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { Badge } from "@/components/ui/badge"
import { Flag, ChevronDown, X } from "lucide-react"
import FeedbackPopover from "./FeedbackPopover"

// Example placeholder import (if you had a discussion component):
// import { QuestionSolutions } from "@/components/shared/QuestionSolutions"

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
  | "Mcqm"      // multiple correct
  | "Fill Blanks"
  | "T/f"
  | string

interface QuestionType {
  id: number
  questionId?: string
  text?: string
  options?: string[]
  markscheme?: string
  explanation?: string   // new field for markscheme/explanation
  correctOption?: string
  diagramUrl?: string
  exam?: string
  subject?: string
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

// ----------------------------
// Outline color logic
// ----------------------------
function getOutlineClass(feedback: string | undefined, isMarkedForReview: boolean): string {
  if (isMarkedForReview) {
    // Subtle yellow
    return "outline outline-2 outline-yellow-200"
  } else if (feedback === "correct") {
    // Subtle green
    return "outline outline-2 outline-green-200"
  } else if (feedback === "incorrect") {
    // Subtle red
    return "outline outline-2 outline-red-200"
  } else {
    // Default subtle gray
    return "outline outline-2 outline-gray-200"
  }
}

export default function Question({
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

  // Old UI states
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(selectedOption || null)

  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)

  // Additional question-type states
  const [mcqmSelections, setMcqmSelections] = useState<string[]>([]) // for MCQM
  const [fillBlanksInput, setFillBlanksInput] = useState<string>("") // for Fill Blanks
  const [subjectiveAnswer, setSubjectiveAnswer] = useState<string>("") // for Subjective

  // Tagging
  const [newTag, setNewTag] = useState("")
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])

  // Difficulty
  const [localDifficultyRating, setLocalDifficultyRating] = useState<number | undefined>(
    question.difficultyRating
  )

  // Toast
  const { toast } = useToast()

  // Swipe (left/right)
  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  // Show/hide discussion state
  const [showDiscussion, setShowDiscussion] = useState(false)

  // Sync localSelectedOption if parent changes
  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  // ----------------------------
  // Tag logic: add & remove
  // ----------------------------
  async function handleAddTag() {
    if (!newTag || !question.questionId) return
    if (localCustomTags.includes(newTag)) {
      toast({ title: "Tag already added" })
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
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not remove custom tag. Check logs.",
        variant: "destructive",
      })
    }
  }

  // ----------------------------
  // Mark Complete / Flag
  // ----------------------------
  async function toggleComplete(checked: boolean) {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, checked)
    if (checked) {
      toast({
        title: "Question Completed",
        description: `You have completed question #${displayNumber}.`,
        action: (
          <ToastAction onClick={() => toggleComplete(false)} altText="Undo">
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Unmarked Complete",
        description: `Question #${displayNumber} is no longer marked complete.`,
      })
    }
  }

  async function toggleReview() {
    if (!question.questionId) return
    const newVal = !isMarkedForReview
    await handleMarkForReview(question.questionId, newVal)
    if (newVal) {
      toast({
        title: "Question Flagged",
        description: `Flagged question #${displayNumber} for review.`,
        action: (
          <ToastAction onClick={() => toggleReview()} altText="Undo">
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Question Unflagged",
        description: `Removed review flag for question #${displayNumber}.`,
      })
    }
  }

  // ----------------------------
  // Old UI MCQ block
  // ----------------------------
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

  // ----------------------------
  // Old UI Numerical block
  // ----------------------------
  async function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    await handleNumericalSubmit(
      question.questionId,
      numericalAnswer ?? "",
      question.correctOption ?? "N/A"
    )
  }

  // ----------------------------
  // Additional blocks (T/f, Fill Blanks, Mcqm, Subjective)
  // ----------------------------

  // MCQM
  function handleMcqmToggle(letter: string) {
    setMcqmSelections((prev) => {
      if (prev.includes(letter)) return prev.filter((x) => x !== letter)
      return [...prev, letter]
    })
  }
  async function handleMcqmSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, JSON.stringify(mcqmSelections), question.correctOption ?? "")
  }

  // T/f
  const tfOptions = ["True", "False"]
  async function handleTfSubmit(answer: string) {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, answer, question.correctOption ?? "")
    setLocalSelectedOption(answer)
  }

  // Fill Blanks
  async function handleFillBlanksSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleNumericalSubmit(question.questionId, fillBlanksInput, question.correctOption ?? "")
  }

  // Subjective
  async function handleSubjectiveSubmit() {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleNumericalSubmit(question.questionId, subjectiveAnswer, question.correctOption ?? "")
  }

  // ----------------------------
  // Difficulty rating
  // ----------------------------
  async function handleDifficultyChange(newRating: number) {
    if (!question.questionId) return
    setLocalDifficultyRating(newRating)

    let newDifficulty = "easy"
    if (newRating === 2) newDifficulty = "medium"
    else if (newRating === 3) newDifficulty = "hard"

    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          difficultyRating: newRating,
          difficulty: newDifficulty,
        }),
      })
      toast({
        title: "Difficulty Updated",
        description: `Set question #${displayNumber} difficulty to ${newDifficulty}.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not update difficulty rating.",
        variant: "destructive",
      })
    }
  }

  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-20" id={`question-${question.questionId}`}>
        <Card
          className={`
            w-full overflow-hidden mb-6
            dark:bg-gray-800 dark:text-gray-100
            border border-gray-200 dark:border-gray-600
            rounded-md
            ${getOutlineClass(feedback, isMarkedForReview)}
          `}
        >
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Title + Subject + Difficulty + etc. */}
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="font-normal text-2xl sm:text-3xl">
                  Question #{displayNumber}
                </CardTitle>

                {question.subject && (
                  <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                    {question.subject}
                  </div>
                )}
                {question.difficulty && (
                  <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                    {question.difficulty}
                  </div>
                )}
                {typeof question.year === "number" && (
                  <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                    {question.year}
                  </div>
                )}
                {question.type && (
                  <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                    {question.type}
                  </div>
                )}
                {question.exam && (
                  <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                    {question.exam}
                  </div>
                )}

                {/* Custom Tags */}
                {localCustomTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {/* Add new tag */}
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Add a new tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-32"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleAddTag} size="sm">
                        <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                        Add
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new tag</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Mark Complete & Flag */}
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id={`complete-${question.questionId}`}
                      checked={isMarkedComplete}
                      onCheckedChange={(checked) => toggleComplete(!!checked)}
                      className="dark:bg-gray-800 dark:border-gray-500"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMarkedComplete ? "Unmark Complete" : "Mark as Complete"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleReview}>
                      <Flag
                        className={
                          isMarkedForReview
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-500"
                        }
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMarkedForReview ? "Unflag for Review" : "Flag for Review"}
                  </TooltipContent>
                </Tooltip>

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
                <div className="latex-font text-base sm:text-lg md:text-xl leading-7 mb-4 text-gray-700 dark:text-gray-100">
                  <MathRenderer text={question.text} />
                </div>
              )}
            </div>

            {/* ---------- MCQ ---------- */}
            {(question.type === "Multiple Choice" || question.type?.toLowerCase() === "mcq") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-2">
                    {question.options.map((rawOption, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const optionText = cleanOptionText(rawOption)
                      const isPending = pendingOption === letter
                      const directSelected = localSelectedOption === letter
                      const isFeedbackActive = directSelected && feedback

                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          onClick={() => handleOptionSelect(letter)}
                          className={`
                            w-full
                            text-left
                            text-base
                            sm:text-lg
                            p-4
                            leading-7
                            flex flex-col items-start
                            space-y-2
                            whitespace-normal
                            border
                            ${
                              isFeedbackActive
                                ? feedback === "correct"
                                  ? "bg-green-100 hover:bg-green-200 text-green-700 border-green-400"
                                  : "bg-red-100 hover:bg-red-200 text-red-700 border-red-400"
                                : isPending
                                ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-200"
                                : "border-gray-300 dark:border-gray-600"
                            }
                          `}
                          style={{ height: "auto", minHeight: "1rem" }}
                        >
                          <span className="font-semibold">{letter}.</span>
                          {optionText.startsWith("http") ? (
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
                            <div className="latex-font">
                              <MathRenderer text={optionText} />
                            </div>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleMcqSubmit}
                          disabled={!pendingOption}
                          className="
                            border
                            border-blue-400
                            bg-blue-50
                            text-blue-800
                            dark:border-blue-600
                            dark:bg-slate-800
                            dark:text-blue-200
                            px-4 py-1
                            hover:bg-blue-100
                            dark:hover:bg-slate-700
                            rounded-sm
                          "
                        >
                          Submit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Submit your MCQ answer</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() =>
                            question.questionId && handleResetQuestion(question.questionId)
                          }
                        >
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear answer & unmark question</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

            {/* ---------- Numerical ---------- */}
            {(question.type === "Numerical" ||
              question.type?.toLowerCase() === "numerical" ||
              question.type === "integer") && (
              <div className="mb-4">
                <Input
                  type="text"
                  className="
                    w-full
                    px-3 py-2
                    border
                    border-blue-400
                    bg-blue-50
                    text-blue-800
                    dark:border-blue-600
                    dark:bg-slate-800
                    dark:text-blue-200
                    focus:ring-1
                    focus:ring-blue-300
                    rounded-sm
                  "
                  placeholder="Type your answer..."
                  value={numericalAnswer ?? ""}
                  onChange={(e) => {
                    if (question.questionId) {
                      handleNumericalChange(question.questionId, e.target.value)
                    }
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="
                          border
                          border-blue-400
                          bg-blue-50
                          text-blue-800
                          dark:border-blue-600
                          dark:bg-slate-800
                          dark:text-blue-200
                          px-4 py-1
                          hover:bg-blue-100
                          dark:hover:bg-slate-700
                          rounded-sm
                        "
                        onClick={handleNumericalSubmitLocal}
                      >
                        Submit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Submit your numeric answer</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() =>
                          question.questionId && handleResetQuestion(question.questionId)
                        }
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear answer & unmark question</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* ---------- MCQM ---------- */}
            {(question.type === "Mcqm" || question.type?.toLowerCase() === "mcqm") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-2">
                    {question.options.map((rawOption, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const optionText = rawOption.trim()
                      const isChosen = mcqmSelections.includes(letter)

                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          onClick={() => handleMcqmToggle(letter)}
                          className={`
                            w-full
                            text-left
                            text-base
                            sm:text-lg
                            p-4
                            leading-7
                            flex flex-col items-start
                            whitespace-normal
                            border
                            ${
                              isChosen
                                ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-200"
                                : "border-gray-300 dark:border-gray-600"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isChosen}
                              onCheckedChange={() => handleMcqmToggle(letter)}
                            />
                            <span className="font-semibold">{letter}.</span>
                          </div>
                          {optionText.startsWith("http") ? (
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
                            <div className="latex-font">
                              <MathRenderer text={optionText} />
                            </div>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleMcqmSubmit}
                          className="
                            border
                            border-blue-400
                            bg-blue-50
                            text-blue-800
                            dark:border-blue-600
                            dark:bg-slate-800
                            dark:text-blue-200
                            px-4 py-1
                            hover:bg-blue-100
                            dark:hover:bg-slate-700
                            rounded-sm
                          "
                        >
                          Submit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Submit your MCQM selections</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() =>
                            question.questionId && handleResetQuestion(question.questionId)
                          }
                        >
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear selections & unmark question</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

            {/* ---------- T/f ---------- */}
            {(question.type === "T/f" || question.type?.toLowerCase() === "t/f" ||
              question.type?.toLowerCase() === "true/false") && (
              <div className="mb-4 flex gap-4">
                {tfOptions.map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    onClick={() => handleTfSubmit(val)}
                    className={`
                      px-4 py-2
                      ${
                        localSelectedOption === val && feedback
                          ? feedback === "correct"
                            ? "bg-green-100 hover:bg-green-200 text-green-700 border-green-400"
                            : "bg-red-100 hover:bg-red-200 text-red-700 border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }
                    `}
                  >
                    {val}
                  </Button>
                ))}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() =>
                        question.questionId && handleResetQuestion(question.questionId)
                      }
                    >
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear T/F answer & unmark question</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* ---------- Fill Blanks ---------- */}
            {question.type?.toLowerCase() === "fill blanks" && (
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Fill in the blank..."
                  value={fillBlanksInput}
                  onChange={(e) => setFillBlanksInput(e.target.value)}
                  className="w-full mb-2"
                />
                <div className="mt-2 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="
                          border
                          border-blue-400
                          bg-blue-50
                          text-blue-800
                          dark:border-blue-600
                          dark:bg-slate-800
                          dark:text-blue-200
                          px-4 py-1
                          hover:bg-blue-100
                          dark:hover:bg-slate-700
                          rounded-sm
                        "
                        onClick={handleFillBlanksSubmit}
                      >
                        Submit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Submit your fill-in answer</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() =>
                          question.questionId && handleResetQuestion(question.questionId)
                        }
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear answer & unmark question</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* ---------- Subjective ---------- */}
            {question.type?.toLowerCase() === "subjective" && (
              <div className="mb-4">
                <div className="mb-2">
                  <label className="text-sm font-medium">Your Answer:</label>
                </div>
                <textarea
                  className="
                    w-full
                    px-3 py-2
                    border
                    border-blue-400
                    bg-blue-50
                    text-blue-800
                    dark:border-blue-600
                    dark:bg-slate-800
                    dark:text-blue-200
                    rounded-sm
                    focus:ring-1
                    focus:ring-blue-300
                  "
                  rows={4}
                  value={subjectiveAnswer}
                  onChange={(e) => setSubjectiveAnswer(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="
                          border
                          border-blue-400
                          bg-blue-50
                          text-blue-800
                          dark:border-blue-600
                          dark:bg-slate-800
                          dark:text-blue-200
                          px-4 py-1
                          hover:bg-blue-100
                          dark:hover:bg-slate-700
                          rounded-sm
                        "
                        onClick={handleSubjectiveSubmit}
                      >
                        Submit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Submit your written answer</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() =>
                          question.questionId && handleResetQuestion(question.questionId)
                        }
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear answer & unmark question</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* ---------- Feedback banner ---------- */}
            {feedback && (
              <div
                className={`mt-4 p-2 rounded ${
                  feedback === "correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {feedback === "correct" ? "Correct!" : "Incorrect, try again."}
              </div>
            )}

            {/* ---------- Show Markscheme Button ---------- */}
            {markschemeEnabled && (
              <div className="mt-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowMarkschemeModal(!showMarkschemeModal)
                        if (question.questionId) {
                          handleMarkschemeToggle(question.questionId)
                        }
                      }}
                    >
                      Show Markscheme
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View the markscheme / explanation</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* ---------- Difficulty Dropdown ---------- */}
            <div className="flex items-center space-x-2 mt-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Difficulty:</label>
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

          {/* ---------- CardFooter with Discussion Toggle ---------- */}
          <CardFooter className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDiscussion(!showDiscussion)}
            >
              {showDiscussion ? "Hide" : "Discussion"}
            </Button>
          </CardFooter>

          {/* ---------- Discussion Section (Expandable) ---------- */}
          <AnimatePresence>
            {showDiscussion && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="border-t border-gray-300 dark:border-gray-700 p-4 max-h-[400px] overflow-y-auto">
                  <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Comment Section
                  </p>
                  {/* 
                    Insert your comment component here. E.g.:
                    <QuestionSolutions questionId={question.questionId} />
                    For now, just a placeholder:
                  */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    This is where your fully featured comment section & tiptap editor will appear.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ---------- Markscheme (Explanation) Modal ---------- */}
        <AnimatePresence>
          {showMarkschemeModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            >
              <Card className="w-full max-w-2xl dark:bg-gray-800 dark:text-gray-100">
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
                      ? typeof question.explanation === "string" && question.explanation.startsWith("http") ? (
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
                            {/* If question.explanation is JSON or a string */}
                            <MathRenderer text={String(question.explanation || "")} />
                          </div>
                        )
                      : question.markscheme
                      ? question.markscheme.startsWith("http") ? (
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

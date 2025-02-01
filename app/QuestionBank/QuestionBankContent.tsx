"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import MathRenderer from "@/components/layout/MathRenderer"
import {
  ChevronDown,
  Flag,
  X,
  // note: removed AI/Comments icons like LucideBot, MessageSquare, etc.
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import SettingsPopover from "@/components/ui/SettingsPopover"
import FeedbackPopover from "@/components/shared/FeedbackPopover"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastAction } from "@/components/ui/toast"

enum QuestionStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

type QuestionTypeString = "Multiple Choice" | "mcq" | "Numerical" | "integer" | string

interface QuestionType {
  id: number
  questionId?: string
  text?: string
  options?: string[]
  markscheme?: string
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
  // more fields if needed
}

interface QuestionProps {
  question: QuestionType
  feedback: string | undefined
  selectedOption: string | undefined
  numericalAnswer: string | undefined
  showMarkscheme: boolean
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
  userId: string
  totalQuestions: number
  currentQuestionIndex: number
  handleQuestionChange: (index: number) => void
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
  userId,
  totalQuestions,
  currentQuestionIndex,
  handleQuestionChange,
}: QuestionProps) {
  const displayNumber = currentQuestionIndex + 1
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(
    selectedOption || null
  )
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)
  const [newTag, setNewTag] = useState("")
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)
  const [localDifficultyRating, setLocalDifficultyRating] = useState<number | undefined>(
    question.difficultyRating
  )
  const { toast } = useToast()

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // optionally handle next question
    },
    onSwipedRight: () => {
      // optionally handle previous question
    },
    trackMouse: true,
  })

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  function handleAddTag() {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag])
      setNewTag("")
    }
  }

  function handleRemoveTag(tag: string) {
    setLocalCustomTags(localCustomTags.filter((t) => t !== tag))
  }

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

  function handleOptionSelect(letter: string) {
    setPendingOption(letter)
  }

  async function handleMcqSubmit() {
    if (!pendingOption || !question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, pendingOption, question.correctOption ?? "")
    setLocalSelectedOption(pendingOption)
  }

  async function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    await handleNumericalSubmit(
      question.questionId,
      numericalAnswer ?? "", // ensure a string
      question.correctOption ?? ""
    )
  }

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

  function cleanOptionText(option: string): string {
    return option.replace(/^[A-D]:\s?/i, "").trim()
  }

  function getBorderColorClass() {
    if (isMarkedForReview) {
      return "border-yellow-500 border-2"
    } else if (feedback === "correct") {
      return "border-green-500 border-2"
    } else if (feedback === "incorrect") {
      return "border-red-500 border-2"
    } else {
      return "border-gray-300 dark:border-gray-600 border-2"
    }
  }

  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-4" id={`question-${question.questionId}`}>
        <Card className={`w-full overflow-hidden mb-4 dark:bg-gray-800 dark:text-gray-100 ${getBorderColorClass()}`}>
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
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

                {/* Custom tags */}
                {localCustomTags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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

              <div className="flex items-center space-x-4 mt-2 md:mt-0">
                {/* Mark as completed (checkbox) */}
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

                {/* Flag for review */}
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

                {/* Settings popover */}
                <SettingsPopover
                  markschemeEnabled={markschemeEnabled}
                  setMarkschemeEnabled={() => setMarkschemeEnabled(!markschemeEnabled)}
                  aiEnabled={aiEnabled}
                  setAiEnabled={setAiEnabled}
                  notesEnabled={notesEnabled}
                  setNotesEnabled={setNotesEnabled}
                />

                {/* Feedback popover */}
                {question.questionId && <FeedbackPopover questionId={question.questionId} />}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Diagram */}
            {question.diagramUrl && question.diagramUrl !== "" && (
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

            {/* Text */}
            {question.text && (
              <div className="latex-font text-base sm:text-lg md:text-xl leading-7 mb-4 text-gray-700 dark:text-gray-100">
                <MathRenderer text={question.text} />
              </div>
            )}

            {/* Numerical */}
            {(question.type === "Numerical" || question.type === "integer") && (
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
                        onClick={() => question.questionId && handleResetQuestion(question.questionId)}
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear answer & unmark question</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* MCQ */}
            {(question.type === "Multiple Choice" || question.type === "mcq") &&
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

            {/* Feedback banner */}
            {feedback && (
              <div
                className={`mt-4 p-2 rounded ${
                  feedback === "correct"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {feedback === "correct" ? "Correct!" : "Incorrect, try again."}
              </div>
            )}

            {/* Markscheme button (if user has selected an option, or numeric) */}
            {((localSelectedOption && markschemeEnabled) ||
              ((question.type === "Numerical" || question.type === "integer") &&
                numericalAnswer &&
                markschemeEnabled)) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setShowMarkschemeModal(!showMarkschemeModal)
                      question.questionId && handleMarkschemeToggle(question.questionId)
                    }}
                  >
                    Show Markscheme
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View the markscheme</TooltipContent>
              </Tooltip>
            )}

            {/* Difficulty dropdown */}
            <div className="flex items-center space-x-2 mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Difficulty:</span>
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
        </Card>

        {/* Markscheme modal */}
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
                <div className="flex flex-row items-center justify-between px-4 py-2 border-b dark:border-gray-700">
                  <CardTitle>Markscheme</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowMarkschemeModal(false)}>
                          <span className="sr-only">Close markscheme</span>
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Close markscheme</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardContent className="overflow-y-auto max-h-[60vh]">
                  {question.markscheme?.startsWith("http") ? (
                    <div className="relative w-full max-w-lg mx-auto">
                      <Image
                        src={question.markscheme}
                        alt="Markscheme image"
                        width={800}
                        height={600}
                        className="rounded-md w-full h-auto object-contain"
                      />
                    </div>
                  ) : question.markscheme ? (
                    <div className="latex-font">
                      <MathRenderer text={question.markscheme ?? ""} />
                    </div>
                  ) : (
                    "No answer available"
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

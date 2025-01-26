"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import { Checkbox } from "@/components/ui/checkbox"
import MathRenderer from "@/components/layout/MathRenderer"
import {
  BookOpen,
  LucideBot,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Reply,
  CornerDownRight,
  Flag,
  ChevronDown,
  RotateCw, // for reset icon, or use any other icon
} from "lucide-react"
import Image from "next/image"
import Tiptap from "@/components/layout/Tiptap"
import Chat from "@/components/shared/Chat"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import SettingsPopover from "@/components/ui/SettingsPopover"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import FeedbackPopover from "./FeedbackPopover"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// ---------------------------------
// Types
// ---------------------------------
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
  customTag?: string
  explanation?: any
  linkedResources?: any
  commonMistakes?: any
  discussionLink?: string
  parentQuestionId?: number
  difficultyRating?: number
  peerSolvedPercentage?: number | null
  updatedBy?: string
  source?: string
  updatedTime?: number
  isOutOfSyllabus?: boolean
  isBonus?: boolean
  marks?: number
  negMarks?: number
  correctAttempts?: string
  wrongAttempts?: string
  averageTimeTaken?: string
}

interface CommentType {
  id: string
  userId: string
  username: string
  content: string
  timestamp: string
  replies: CommentType[]
  upvotes: number
  downvotes: number
  edited: boolean
}

interface QuestionProps {
  question: QuestionType
  feedback: string | undefined
  selectedOption: string | undefined
  numericalAnswer: string | undefined
  showMarkscheme: boolean | undefined

  handleOptionClick: (
    questionId: string,
    option: string,
    correctOption: string
  ) => void
  handleNumericalSubmit: (
    questionId: string,
    userAnswer: string,
    correctAnswer: string
  ) => void
  handleNumericalChange: (questionId: string, value: string) => void
  handleMarkschemeToggle: (questionId: string) => void
  handleMarkForReview: (questionId: string, newVal?: boolean) => void
  handleMarkComplete: (questionId: string, newVal?: boolean) => void

  isMarkedForReview: boolean
  isMarkedComplete: boolean
  markschemesDisabled: boolean

  note: string
  handleNoteChange: (questionId: string, note: string) => void
  handleDeleteNote: (questionId: string) => Promise<void>
  userId: string

  onNextQuestion?: () => void
  onPreviousQuestion?: () => void
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
  isMarkedForReview,
  isMarkedComplete,
  markschemesDisabled,
  note,
  handleNoteChange,
  handleDeleteNote,
  userId,
  onNextQuestion,
  onPreviousQuestion,
  totalQuestions,
  currentQuestionIndex,
  handleQuestionChange,
}: QuestionProps) {
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(
    selectedOption || null
  )
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)
  const [showNotes, setShowNotes] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editedCommentContent, setEditedCommentContent] = useState("")
  const [commentSort, setCommentSort] = useState<"newest" | "oldest" | "popular">("newest")

  const [newTag, setNewTag] = useState("")
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)
  const [localNote, setLocalNote] = useState(note)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [localDifficultyRating, setLocalDifficultyRating] = useState<number | undefined>(
    question.difficultyRating
  )

  const { toast } = useToast()

  // Optional: If you want to fetch difficulty list from an API:
  const [difficultyOptions, setDifficultyOptions] = useState<string[]>([])
  useEffect(() => {
    // If you already have them in context or props, skip this
    ;(async () => {
      try {
        // Example: GET /api/difficulties -> ["Easy", "Medium", "Hard"]
        const resp = await fetch("/api/difficulties")
        if (resp.ok) {
          const data = await resp.json()
          setDifficultyOptions(data) // e.g. ["Easy","Medium","Hard"]
        }
      } catch (e) {
        // fallback or do nothing
      }
    })()
  }, [])

  // optional swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  // -------------------------------------------
  // Tag logic
  // -------------------------------------------
  function handleAddTag() {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag])
      setNewTag("")
    }
  }
  function handleRemoveTag(tag: string) {
    setLocalCustomTags(localCustomTags.filter((t) => t !== tag))
  }

  // -------------------------------------------
  // Mark complete
  // -------------------------------------------
  async function toggleComplete(checked: boolean) {
    if (!question.questionId) return
    await handleMarkComplete(question.questionId, checked)
    if (checked) {
      toast({
        title: "Question Completed",
        description: `You have completed question #${question.id}.`,
        action: (
          <ToastAction onClick={() => toggleComplete(false)} altText="Undo">
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Unmarked Complete",
        description: `Question #${question.id} is no longer marked complete.`,
      })
    }
  }

  // -------------------------------------------
  // Mark for review
  // -------------------------------------------
  async function toggleReview() {
    if (!question.questionId) return
    const newVal = !isMarkedForReview
    await handleMarkForReview(question.questionId, newVal)
    if (newVal) {
      toast({
        title: "Question Flagged",
        description: `Flagged question #${question.id} for review.`,
        action: (
          <ToastAction onClick={() => toggleReview()} altText="Undo">
            Undo
          </ToastAction>
        ),
      })
    } else {
      toast({
        title: "Question Unflagged",
        description: `Removed review flag for question #${question.id}.`,
      })
    }
  }

  // -------------------------------------------
  // Reset question
  // -------------------------------------------
  const handleResetQuestion = () => {
    if (!question.questionId) return

    // 1) Clear local UI states
    setPendingOption(null)
    setLocalSelectedOption(null)

    // 2) Optionally clear numeric input too:
    handleNumericalChange(question.questionId, "")

    // 3) Mark question as incomplete
    handleMarkComplete(question.questionId, false)

    // 4) Clear feedback if you track it in a global parent
    //    E.g. call a parent function or dispatch from parent. 
    //    If you have a "setFeedback" from the parent, call that here:
    //    setFeedbackForQuestion(question.questionId, "") -- pseudo code

    toast({
      title: "Question Reset",
      description: `Question #${question.id} is reset to an unanswered state.`,
    })
  }

  // -------------------------------------------
  // MCQ
  // -------------------------------------------
  function handleOptionSelect(letter: string) {
    setPendingOption(letter)
  }
  function handleMcqSubmit() {
    if (!pendingOption || !question.questionId) return
    handleOptionClick(question.questionId, pendingOption, question.correctOption ?? "N/A")
    setLocalSelectedOption(pendingOption)
  }

  // -------------------------------------------
  // Numeric
  // -------------------------------------------
  function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    handleNumericalSubmit(question.questionId, numericalAnswer ?? "", question.correctOption ?? "N/A")
  }

  // -------------------------------------------
  // Difficulty rating
  // -------------------------------------------
  async function handleDifficultyChange(newRating: number) {
    if (!question.questionId) return
    setLocalDifficultyRating(newRating)

    // You might also store a more "descriptive" difficulty string if needed:
    let newDifficulty = "Easy"
    if (newRating === 2) newDifficulty = "Medium"
    else if (newRating === 3) newDifficulty = "Hard"

    // optionally patch
    try {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          difficultyRating: newRating,
          difficulty: newDifficulty, // if you want the textual as well
        }),
      })
      toast({
        title: "Difficulty Updated",
        description: `Set question #${question.id} difficulty to ${newDifficulty}.`,
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

  // -------------------------------------------
  // Notes
  // -------------------------------------------
  async function saveNote() {
    if (!question.questionId) return
    try {
      const endpoint = noteId ? `/api/notes/${noteId}` : "/api/notes"
      const method = noteId ? "PUT" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          content: localNote,
          title: `Note for Question #${question.id}`,
          type: "TEXT",
        }),
      })
      if (!response.ok) throw new Error("Failed to save note")
      const data = await response.json()
      setNoteId(data.id)
      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      })
    }
  }
  async function deleteNote() {
    if (!noteId || !question.questionId) return
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete note")
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully.",
      })
      setLocalNote("")
      setNoteId(null)
      handleNoteChange(question.questionId, "")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Helper to remove "A:" prefix in certain question data
  function cleanOptionText(option: string): string {
    return option.replace(/^[A-D]:\s?/i, "").trim()
  }

  return (
    <TooltipProvider>
      {/*
        Conditional border classes:
          - Green if completed
          - Yellow if flagged
          - Gray default
      */}
      <div
        {...handlers}
        className={`relative pb-20 rounded-md border-2
          ${isMarkedComplete ? "border-green-600" : isMarkedForReview ? "border-yellow-500" : "border-gray-300"}
          dark:border-gray-700
          p-2 sm:p-4
          mb-6
        `}
        id={`question-${question.questionId}`}
      >
        <Card className="w-full overflow-hidden dark:bg-gray-800 dark:text-gray-100 shadow-none border-0">
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="font-normal text-2xl sm:text-3xl">
                  Question #{question.id}
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
                {question.year !== undefined && (
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

              <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id={`complete-${question.id}`}
                      checked={isMarkedComplete}
                      onCheckedChange={(checked: boolean) => toggleComplete(!!checked)}
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

                <SettingsPopover
                  markschemeEnabled={markschemeEnabled}
                  setMarkschemeEnabled={() => setMarkschemeEnabled(!markschemeEnabled)}
                  aiEnabled={aiEnabled}
                  setAiEnabled={setAiEnabled}
                  notesEnabled={notesEnabled}
                  setNotesEnabled={setNotesEnabled}
                />
                {question.questionId && <FeedbackPopover questionId={question.questionId} />}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              {question.diagramUrl && question.diagramUrl !== "" && (
                <div className="relative w-full max-w-xl mx-auto mb-4">
                  <Image
                    src={question.diagramUrl}
                    alt={`Diagram for question #${question.id}`}
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

            {/* Numeric question */}
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
                  onChange={(e) =>
                    question.questionId &&
                    handleNumericalChange(question.questionId, e.target.value)
                  }
                />
                <div className="flex space-x-2 mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="
                          border-2
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

                  {/* RESET BUTTON */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="
                          text-gray-700 dark:text-gray-100
                          px-4 py-1
                          rounded-sm
                          flex items-center
                        "
                        onClick={handleResetQuestion}
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset question to unanswered</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* MCQ question */}
            {(question.type === "Multiple Choice" || question.type === "mcq") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-2">
                    {question.options.map((rawOption, index) => {
                      const letter = String.fromCharCode(65 + index)
                      const optionText = cleanOptionText(rawOption)
                      const isPending = pendingOption === letter
                      const directSelected = localSelectedOption === letter
                      const isFeedbackActive = directSelected && feedback

                      // Also color the border: green if correct, red if incorrect
                      let feedbackBorderClasses = ""
                      if (isFeedbackActive) {
                        feedbackBorderClasses =
                          feedback === "correct" ? "border-green-500" : "border-red-500"
                      }

                      return (
                        <Button
                          key={index}
                          variant={isPending ? "default" : "outline"}
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
                            border-2
                            ${
                              isPending
                                ? "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-200"
                                : "border-gray-300 dark:border-gray-600"
                            }
                            ${feedbackBorderClasses}
                            ${
                              isFeedbackActive
                                ? feedback === "correct"
                                  ? "bg-green-100 hover:bg-green-200 text-green-700"
                                  : "bg-red-100 hover:bg-red-200 text-red-700"
                                : ""
                            }
                          `}
                          style={{
                            height: "auto",
                            minHeight: "1rem",
                          }}
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

                  <div className="flex space-x-2 mt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleMcqSubmit}
                          disabled={!pendingOption}
                          className="
                            border-2
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

                    {/* RESET BUTTON */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="
                            text-gray-700 dark:text-gray-100
                            px-4 py-1
                            rounded-sm
                            flex items-center
                          "
                          onClick={handleResetQuestion}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset question to unanswered</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

            {/* feedback color e.g. correct/incorrect */}
            {feedback && (
              <div
                className={`mt-4 p-2 rounded ${
                  feedback === "correct"
                    ? "bg-green-100 text-green-700"
                    : feedback === "incorrect"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {feedback === "correct"
                  ? "Correct!"
                  : feedback === "incorrect"
                  ? "Incorrect, try again."
                  : "No answer available"}
              </div>
            )}

            {/* Markscheme button if user answered & allowed */}
            {(
              (localSelectedOption && markschemeEnabled) ||
              ((question.type === "Numerical" || question.type === "integer") &&
                numericalAnswer &&
                markschemeEnabled)
            ) && (
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

            {/* Difficulty (example using a numeric rating in DB) */}
            <div className="flex items-center space-x-2 mt-4">
              <Label className="text-sm text-gray-600 dark:text-gray-300">Difficulty:</Label>
              <Select
                value={
                  localDifficultyRating === 1
                    ? "Easy"
                    : localDifficultyRating === 2
                    ? "Medium"
                    : localDifficultyRating === 3
                    ? "Hard"
                    : ""
                }
                onValueChange={(val) => {
                  let rating = 1
                  if (val === "Medium") rating = 2
                  if (val === "Hard") rating = 3
                  handleDifficultyChange(rating)
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Set difficulty" />
                </SelectTrigger>

                <SelectContent>
                  {/*
                    If you are fetching from your dynamic difficulties, 
                    you can map over them like:
                    
                    {difficultyOptions.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                    
                    Otherwise, just hardcode:
                  */}
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setShowNotes(!showNotes)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {showNotes ? "Hide Notes" : "Take Notes"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showNotes ? "Hide note-taking interface" : "Open note-taking interface"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setShowAI(!showAI)}>
                  <LucideBot className="mr-2 h-4 w-4" />
                  {showAI ? "Hide AI" : "AI Assistance"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showAI ? "Hide AI assistant" : "Get AI help"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setShowComments(!showComments)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {showComments ? "Hide Comments" : "Show Comments"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showComments ? "Hide comments" : "View and add comments"}
              </TooltipContent>
            </Tooltip>
          </CardFooter>
        </Card>

        {/* Notes section */}
        {showNotes && (
          <Card className="mb-6 dark:bg-gray-800 dark:text-gray-100">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add your notes for this question here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tiptap
                content={localNote}
                onUpdate={(content) => {
                  setLocalNote(content)
                  question.questionId && handleNoteChange(question.questionId, content)
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={saveNote}>
                Save Note
              </Button>
              <Button variant="destructive" onClick={deleteNote} disabled={!noteId}>
                Delete Note
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* AI section */}
        {showAI && (
          <Card className="mb-6 dark:bg-gray-800 dark:text-gray-100">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Ask for help or clarification on this question.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {question.questionId && (
                <Chat
                  questionId={question.questionId}
                  questionText={question.text ?? ""}
                  options={question.options}
                  markscheme={question.markscheme}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {showComments && (
          <Card className="mb-6 dark:bg-gray-800 dark:text-gray-100">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discuss or ask questions here!</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ... your comment section code ... */}
              {/* omitted for brevity */}
            </CardContent>
          </Card>
        )}

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Markscheme</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative"
                          onClick={() => setShowMarkschemeModal(false)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close markscheme</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Close markscheme</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[60vh]">
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

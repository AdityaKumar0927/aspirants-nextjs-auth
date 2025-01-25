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

// Enums & Types
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

  // Toggle mark-for-review & complete
  handleMarkForReview: (questionId: string, newVal?: boolean) => void
  handleMarkComplete: (questionId: string, newVal?: boolean) => void
  isMarkedForReview: boolean
  isMarkedComplete: boolean
  markschemesDisabled: boolean

  // Notes
  note: string
  handleNoteChange: (questionId: string, note: string) => void
  handleDeleteNote: (questionId: string) => Promise<void>
  userId: string

  // Nav
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
  // For MCQ "Submit" approach
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  // local highlight of user’s final selected option
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

  // swipe left/right
  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  // Tag logic
  function handleAddTag() {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag])
      setNewTag("")
    }
  }
  function handleRemoveTag(tagToRemove: string) {
    setLocalCustomTags(localCustomTags.filter((tag) => tag !== tagToRemove))
  }

  // Toggle complete
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
        description: `You have unmarked question #${question.id}.`,
      })
    }
  }

  // Toggle review
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

  // For MCQ, store selected in pendingOption
  function handleOptionSelect(letter: string) {
    setPendingOption(letter)
  }
  function handleMcqSubmit() {
    if (!pendingOption || !question.questionId) return
    // highlight selection
    setLocalSelectedOption(pendingOption)
    // call parent
    handleOptionClick(question.questionId, pendingOption, question.correctOption ?? "N/A")
  }

  // Numeric
  function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    handleNumericalSubmit(question.questionId, numericalAnswer ?? "", question.correctOption ?? "N/A")
  }

  // Difficulty rating
  async function handleDifficultyChange(newRating: number) {
    if (!question.questionId) return
    setLocalDifficultyRating(newRating)

    let newDiff = "easy"
    if (newRating === 2) newDiff = "medium"
    if (newRating === 3) newDiff = "hard"
    question.difficulty = newDiff

    try {
      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          difficultyRating: newRating,
          difficulty: newDiff,
        }),
      })
      if (!res.ok) throw new Error("Failed to update difficulty")
      toast({
        title: "Difficulty Updated",
        description: `Question #${question.id} is now ${newDiff}.`,
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

  // Notes
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
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to save note.",
        variant: "destructive",
      })
    }
  }
  async function deleteNote() {
    if (!noteId || !question.questionId) return
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete note")
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully.",
      })
      setLocalNote("")
      setNoteId(null)
      handleNoteChange(question.questionId, "")
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      })
    }
  }

  // Reset question
  function handleResetQuestion() {
    if (!question.questionId) return
    toast({
      title: "Question Reset",
      description: `You can now re-attempt question #${question.id}.`,
    })
    // Clear local states
    setPendingOption(null)
    setLocalSelectedOption(null)
  }

  // Comments
  function handleAddComment() {
    if (!newComment.trim()) return
    const newCom: CommentType = {
      id: Date.now().toString(),
      userId: userId || "guest",
      username: "Current User",
      content: newComment,
      timestamp: new Date().toISOString(),
      replies: [],
      upvotes: 0,
      downvotes: 0,
      edited: false,
    }
    setComments([...comments, newCom])
    setNewComment("")
  }
  function handleReply(parentId: string, replyContent: string) {
    const updated = comments.map((c) => {
      if (c.id === parentId) {
        return {
          ...c,
          replies: [
            ...c.replies,
            {
              id: Date.now().toString(),
              userId: userId || "guest",
              username: "Current User",
              content: replyContent,
              timestamp: new Date().toISOString(),
              replies: [],
              upvotes: 0,
              downvotes: 0,
              edited: false,
            },
          ],
        }
      }
      return c
    })
    setComments(updated)
    setReplyingTo(null)
    setNewComment("")
  }
  function handleEditComment(commentId: string, newContent: string) {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, content: newContent, edited: true }
      }
      return {
        ...c,
        replies: c.replies.map((r) => (r.id === commentId ? { ...r, content: newContent, edited: true } : r)),
      }
    })
    setComments(updated)
    setEditingCommentId(null)
  }
  function handleDeleteComment(commentId: string) {
    const updated = comments.filter((c) => {
      if (c.id === commentId) return false
      c.replies = c.replies.filter((r) => r.id !== commentId)
      return true
    })
    setComments(updated)
  }
  function handleVote(commentId: string, type: "upvote" | "downvote") {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          upvotes: type === "upvote" ? c.upvotes + 1 : c.upvotes,
          downvotes: type === "downvote" ? c.downvotes + 1 : c.downvotes,
        }
      }
      c.replies = c.replies.map((r) =>
        r.id === commentId
          ? {
              ...r,
              upvotes: type === "upvote" ? r.upvotes + 1 : r.upvotes,
              downvotes: type === "downvote" ? r.downvotes + 1 : r.downvotes,
            }
          : r
      )
      return c
    })
    setComments(updated)
  }
  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    if (commentSort === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    return b.upvotes - a.upvotes
  })

  // remove "A:", "B:" prefix if any
  function cleanOptionText(option: string): string {
    return option.replace(/^[A-D]:\s?/i, "").trim()
  }

  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-20" id={`question-${question.questionId}`}>
        <Card className="w-full overflow-hidden mb-6 dark:bg-gray-800">
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Title & tags */}
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="font-normal text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
                  Question #{question.id}
                </CardTitle>
                {/* Info tags */}
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
                {/* Custom tags */}
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

              {/* Right side icons */}
              <div className="flex items-center space-x-4">
                {/* Mark Complete */}
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
            {/* Possibly show a diagram */}
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
              {/* Question text */}
              {question.text && (
                <div className="latex-font text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-100 leading-7 mb-4">
                  <MathRenderer text={question.text} />
                </div>
              )}
            </div>

            {/* If numeric */}
            {(question.type === "Numerical" || question.type === "integer") && (
              <div className="mb-4">
                <Input
                  type="text"
                  className="w-full px-3 py-2 border border-sky-400 rounded-sm bg-sky-50 text-sky-700 dark:bg-gray-700 dark:border-sky-400 dark:text-sky-300 focus:ring-1 focus:ring-sky-300"
                  placeholder="Type your answer..."
                  value={numericalAnswer ?? ""}
                  onChange={(e) =>
                    question.questionId &&
                    handleNumericalChange(question.questionId, e.target.value)
                  }
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="mt-2 border-2 rounded-sm border-sky-400 bg-sky-50 text-sky-800 px-4 py-1 dark:bg-gray-700 dark:text-sky-200 dark:border-sky-400 hover:opacity-90"
                      onClick={handleNumericalSubmitLocal}
                    >
                      Submit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Submit your numeric answer</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* If MCQ */}
            {(question.type === "Multiple Choice" || question.type === "mcq") &&
              question.options &&
              question.options.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-2">
                    {question.options.map((rawOption, index) => {
                      const letter = String.fromCharCode(65 + index)
                      const optionText = cleanOptionText(rawOption)

                      const isPendingSelected = pendingOption === letter
                      const isFinalSelected = localSelectedOption === letter
                      const isFeedbackActive = isFinalSelected && feedback

                      return (
                        <Button
                          key={index}
                          variant={isPendingSelected ? "default" : "outline"}
                          onClick={() => setPendingOption(letter)}
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
                              isPendingSelected
                                ? "border-sky-400 bg-sky-50 text-sky-800"
                                : "border-gray-300 dark:border-gray-600"
                            }
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
                  <div className="mt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleMcqSubmit}
                          disabled={!pendingOption}
                          className="border-2 rounded-sm border-sky-400 bg-sky-50 text-sky-800 px-4 py-1 dark:bg-gray-700 dark:text-sky-200 dark:border-sky-400 hover:opacity-90"
                        >
                          Submit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Submit your MCQ answer</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}

            {/* Feedback */}
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

            {/* Markscheme button */}
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

            {/* Difficulty */}
            <div className="flex items-center space-x-2 mt-4">
              <Label className="text-sm text-gray-600 dark:text-gray-300">Difficulty:</Label>
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
              {typeof question.peerSolvedPercentage === "number" && (
                <p className="ml-4 text-sm text-gray-500 dark:text-gray-300">
                  Peer Solved: {question.peerSolvedPercentage.toFixed(1)}%
                </p>
              )}
            </div>

            {/* Reset question */}
            <div className="mt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900"
                    onClick={handleResetQuestion}
                  >
                    Reset Question
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear answer &amp; feedback for re-attempt</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            {/* Notes toggle */}
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

            {/* AI toggle */}
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

            {/* Comments toggle */}
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

        {/* Notes */}
        {showNotes && (
          <Card className="mb-6 dark:bg-gray-800">
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

        {/* AI panel */}
        {showAI && (
          <Card className="mb-6 dark:bg-gray-800">
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
          <Card className="mb-6 dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discuss or ask questions here!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="comment-sort">Sort by</Label>
                  <Select
                    value={commentSort}
                    onValueChange={(value: "newest" | "oldest" | "popular") =>
                      setCommentSort(value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort comments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Textarea
                    id="comment"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>Add Comment</Button>
                </div>
                <ScrollArea className="h-[300px]">
                  {sortedComments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      userId={userId}
                      replyingTo={replyingTo}
                      newComment={newComment}
                      setReplyingTo={setReplyingTo}
                      setNewComment={setNewComment}
                      handleReply={handleReply}
                      editingCommentId={editingCommentId}
                      editedCommentContent={editedCommentContent}
                      setEditingCommentId={setEditingCommentId}
                      setEditedCommentContent={setEditedCommentContent}
                      handleEditComment={handleEditComment}
                      handleDeleteComment={handleDeleteComment}
                      handleVote={handleVote}
                      depth={0}
                    />
                  ))}
                </ScrollArea>
              </div>
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
              <Card className="w-full max-w-2xl dark:bg-gray-800">
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
                      <TooltipContent>
                        <p>Close markscheme</p>
                      </TooltipContent>
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

function CommentItem({
  comment,
  userId,
  replyingTo,
  newComment,
  setReplyingTo,
  setNewComment,
  handleReply,
  editingCommentId,
  editedCommentContent,
  setEditingCommentId,
  setEditedCommentContent,
  handleEditComment,
  handleDeleteComment,
  handleVote,
  depth,
}: {
  comment: CommentType
  userId: string
  replyingTo: string | null
  newComment: string
  setReplyingTo: (val: string | null) => void
  setNewComment: (val: string) => void
  handleReply: (parentId: string, replyContent: string) => void
  editingCommentId: string | null
  editedCommentContent: string
  setEditingCommentId: (val: string | null) => void
  setEditedCommentContent: (val: string) => void
  handleEditComment: (id: string, content: string) => void
  handleDeleteComment: (id: string) => void
  handleVote: (id: string, type: "upvote" | "downvote") => void
  depth: number
}) {
  return (
    <div className={`${depth === 0 ? "border-t" : "ml-6"} pt-4 ${depth > 0 ? "mt-4" : ""}`}>
      <div className="flex items-start space-x-2">
        {depth > 0 && <CornerDownRight className="h-6 w-6 text-gray-400 mt-2" />}
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${comment.username}`}
              />
              <AvatarFallback>{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold dark:text-gray-200">{comment.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(comment.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          {editingCommentId === comment.id ? (
            <div className="mt-2">
              <Textarea
                value={editedCommentContent}
                onChange={(e) => setEditedCommentContent(e.target.value)}
                className="w-full"
              />
              <div className="mt-2 space-x-2">
                <Button onClick={() => handleEditComment(comment.id, editedCommentContent)}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingCommentId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 dark:text-gray-200">{comment.content}</p>
          )}
          <div className="mt-2 flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleVote(comment.id, "upvote")}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500 dark:hover:text-green-400"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.upvotes}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Upvote</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleVote(comment.id, "downvote")}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{comment.downvotes}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Downvote</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-gray-500 hover:text-sky-400"
                >
                  <Reply className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            {comment.userId === userId && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id)
                        setEditedCommentContent(comment.content)
                      }}
                      className="text-gray-500 hover:text-yellow-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          {/* If replying */}
          {replyingTo === comment.id && (
            <div className="mt-2">
              <Textarea
                placeholder="Write your reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full"
              />
              <div className="mt-2 space-x-2">
                <Button onClick={() => handleReply(comment.id, newComment)}>Reply</Button>
                <Button variant="outline" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Render any child replies */}
      {comment.replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          userId={userId}
          replyingTo={replyingTo}
          newComment={newComment}
          setReplyingTo={setReplyingTo}
          setNewComment={setNewComment}
          handleReply={handleReply}
          editingCommentId={editingCommentId}
          editedCommentContent={editedCommentContent}
          setEditingCommentId={setEditingCommentId}
          setEditedCommentContent={setEditedCommentContent}
          handleEditComment={handleEditComment}
          handleDeleteComment={handleDeleteComment}
          handleVote={handleVote}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

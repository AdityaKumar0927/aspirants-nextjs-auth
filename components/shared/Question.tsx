"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import MathRenderer from "@/components/layout/MathRenderer"
import Chat from "@/components/shared/Chat"
import FeedbackPopover from "./FeedbackPopover"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import {
  MessageSquare,
  StickyNote,
  Check,
  Flag,
  CornerDownRight,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Reply,
  X,
  ChevronDown,
} from "lucide-react"

import Tiptap from "@/components/layout/Tiptap"
import SettingsPopover from "@/components/ui/SettingsPopover"

enum QuestionStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

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
  type?: string
  reviewed?: boolean
  completed?: boolean
  lastAttempted?: string
  status?: QuestionStatus
  customTags?: string[]
  difficultyRating?: number
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
  handleResetQuestion,
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
  const displayNumber = currentQuestionIndex + 1
  const { toast } = useToast()

  // Local states
  const [pendingOption, setPendingOption] = useState<string | null>(null)
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(selectedOption || null)
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)

  // UI toggles
  const [showNotes, setShowNotes] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showComments, setShowComments] = useState(false)

  // Comments
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editedCommentContent, setEditedCommentContent] = useState("")
  const [commentSort, setCommentSort] = useState<"newest" | "oldest" | "popular">("newest")

  // Tagging
  const [newTag, setNewTag] = useState("")
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])

  // AI & notes toggles
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)
  const [localNote, setLocalNote] = useState(note)
  const [noteId, setNoteId] = useState<string | null>(null)

  // Difficulty rating
  const [localDifficultyRating, setLocalDifficultyRating] = useState<number | undefined>(
    question.difficultyRating
  )

  // For swiping left/right on mobile
  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  // Add / remove custom tag
  function handleAddTag() {
    const t = newTag.trim()
    if (t && !localCustomTags.includes(t)) {
      setLocalCustomTags([...localCustomTags, t])
      setNewTag("")
    }
  }
  function handleRemoveTag(tag: string) {
    setLocalCustomTags(localCustomTags.filter((x) => x !== tag))
  }

  // Mark complete
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

  // Flag for review
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

  // MCQ
  function handleOptionSelect(letter: string) {
    setPendingOption(letter)
  }
  async function handleMcqSubmit() {
    if (!pendingOption || !question.questionId) return
    await handleMarkComplete(question.questionId, true)
    handleOptionClick(question.questionId, pendingOption, question.correctOption ?? "")
    setLocalSelectedOption(pendingOption)
  }

  // Numeric
  async function handleNumericalSubmitLocal() {
    if (!question.questionId) return
    await handleNumericalSubmit(question.questionId, numericalAnswer ?? "", question.correctOption ?? "")
  }

  // Difficulty
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

  // Note
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
          title: `Note for Question #${displayNumber}`,
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

  async function deleteNoteLocal() {
    if (!noteId || !question.questionId) return
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete note")
      toast({
        title: "Note Deleted",
        description: `Deleted note for question #${displayNumber}.`,
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

  // Clean up option text
  function cleanOptionText(option: string): string {
    return option.replace(/^[A-D]:\s?/i, "").trim()
  }

  // Instead of color borders, we remove them for mobile. For desktop, you can keep them if you like,
  // but let's just remove them for a simpler style. If you still want them in desktop, you can conditionally add them.
  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-4 w-full" id={`question-${question.questionId}`}>
        <Card className="w-full overflow-hidden mb-6 dark:bg-gray-800 dark:text-gray-100 border border-transparent">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-normal text-xl sm:text-2xl">
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
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-28"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTag}>
                    <ChevronDown className="mr-1 h-4 w-4 rotate-90" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Mark complete & Flag, new style */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={isMarkedComplete ? "default" : "ghost"}
                        className={`h-8 w-8 ${
                          isMarkedComplete ? "bg-green-600 hover:bg-green-700" : ""
                        }`}
                        onClick={() => toggleComplete(!isMarkedComplete)}
                      >
                        <Check className={`h-4 w-4 ${isMarkedComplete ? "text-white" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as completed</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={isMarkedForReview ? "default" : "ghost"}
                        className={`h-8 w-8 ${
                          isMarkedForReview ? "bg-yellow-500 hover:bg-yellow-600" : ""
                        }`}
                        onClick={() => toggleReview()}
                      >
                        <Flag className={`h-4 w-4 ${isMarkedForReview ? "text-white" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Flag question</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <SettingsPopover
                  markschemeEnabled={markschemesDisabled ? false : true}
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
            {/* Diagram & Text */}
            <div className="mb-4">
              {question.diagramUrl && (
                <div className="relative w-full max-w-xl mx-auto mb-4">
                  <img
                    src={question.diagramUrl}
                    alt={`Diagram for question #${displayNumber}`}
                    className="rounded-md w-full h-auto object-contain"
                  />
                </div>
              )}
              {question.text && (
                <div className="latex-font text-base sm:text-lg leading-7 mb-4 text-gray-700 dark:text-gray-100">
                  <MathRenderer text={question.text} />
                </div>
              )}
            </div>

            {/* If numeric */}
            {(question.type === "Numerical" || question.type === "integer") && (
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Type your answer..."
                  value={numericalAnswer ?? ""}
                  onChange={(e) =>
                    question.questionId && handleNumericalChange(question.questionId, e.target.value)
                  }
                  className="border border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-200"
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleNumericalSubmitLocal}>Submit</Button>
                  <Button variant="outline" onClick={() => question.questionId && handleResetQuestion(question.questionId)}>
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* If MCQ */}
            {(question.type === "Multiple Choice" || question.type === "mcq") &&
              question.options && question.options.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {question.options.map((rawOption, idx) => {
                    const letter = String.fromCharCode(65 + idx)
                    const cleaned = cleanOptionText(rawOption)
                    const isPending = pendingOption === letter
                    const directSelected = localSelectedOption === letter
                    const isFeedbackActive = directSelected && feedback

                    const baseClasses = [
                      "w-full", "text-left", "p-3", "rounded-md", "border", "transition-colors"
                    ]
                    let colorClasses = "border-gray-300 dark:border-gray-600"
                    if (isFeedbackActive) {
                      if (feedback === "correct") {
                        colorClasses = "bg-green-100 text-green-700 border-green-400"
                      } else {
                        colorClasses = "bg-red-100 text-red-700 border-red-400"
                      }
                    } else if (isPending) {
                      colorClasses = "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-200"
                    }

                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => handleOptionSelect(letter)}
                        className={[...baseClasses, colorClasses].join(" ")}
                      >
                        <span className="font-semibold mr-1">{letter}.</span>
                        {cleaned.startsWith("http") ? (
                          <img src={cleaned} alt={`Option ${letter}`} />
                        ) : (
                          <span className="latex-font">
                            <MathRenderer text={cleaned} />
                          </span>
                        )}
                      </Button>
                    )
                  })}

                  <div className="mt-2 flex gap-2">
                    <Button onClick={handleMcqSubmit} disabled={!pendingOption}>
                      Submit
                    </Button>
                    <Button variant="outline" onClick={() => question.questionId && handleResetQuestion(question.questionId)}>
                      Reset
                    </Button>
                  </div>
                </div>
              )}

            {/* Feedback banner */}
            {feedback && (
              <div
                className={`mt-4 p-2 rounded ${
                  feedback === "correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {feedback === "correct" ? "Correct!" : "Incorrect, try again."}
              </div>
            )}

            {/* Markscheme button */}
            {((localSelectedOption && markschemeEnabled) ||
              (question.type === "Numerical" && numericalAnswer && markschemeEnabled)) && (
              <Button variant="outline" className="mt-4" onClick={() => {
                setShowMarkschemeModal(!showMarkschemeModal)
                if (question.questionId) {
                  handleMarkschemeToggle(question.questionId)
                }
              }}>
                Show Markscheme
              </Button>
            )}

            {/* Difficulty */}
            <div className="flex items-center space-x-2 mt-4">
              <Label className="text-sm">Difficulty:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={
                  localDifficultyRating === 1
                    ? "easy"
                    : localDifficultyRating === 2
                    ? "medium"
                    : localDifficultyRating === 3
                    ? "hard"
                    : ""
                }
                onChange={(e) => {
                  let rating = 1
                  if (e.target.value === "medium") rating = 2
                  else if (e.target.value === "hard") rating = 3
                  handleDifficultyChange(rating)
                }}
              >
                <option value="">Set difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </CardContent>

          {/* Three main buttons left-aligned */}
          <CardFooter className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowNotes(!showNotes)}>
              <StickyNote className="mr-2 h-4 w-4" />
              {showNotes ? "Hide Notes" : "Take Notes"}
            </Button>
            <Button variant="outline" onClick={() => setShowAI(!showAI)}>
              {showAI ? "Hide AI" : "AI Assistance"}
            </Button>
            <Button variant="outline" onClick={() => setShowComments(!showComments)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {showComments ? "Hide Comments" : "Show Comments"}
            </Button>
          </CardFooter>
        </Card>

        {/* Notes */}
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
                  if (question.questionId) {
                    handleNoteChange(question.questionId, content)
                  }
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={saveNote}>
                Save Note
              </Button>
              <Button variant="destructive" onClick={deleteNoteLocal} disabled={!noteId}>
                Delete Note
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* AI */}
        {showAI && (
          <Card className="mb-6 dark:bg-gray-800 dark:text-gray-100">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Ask for help or clarification.</CardDescription>
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Sort by</Label>
                  <select
                    className="border px-2 py-1 rounded text-sm"
                    value={commentSort}
                    onChange={(e) => {
                      const val = e.target.value as "newest" | "oldest" | "popular"
                      setCommentSort(val)
                    }}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
                <div>
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button
                    className="mt-2"
                    onClick={() => {
                      if (newComment.trim()) {
                        const newC: CommentType = {
                          id: Date.now().toString(),
                          userId,
                          username: "Current User",
                          content: newComment,
                          timestamp: new Date().toISOString(),
                          replies: [],
                          upvotes: 0,
                          downvotes: 0,
                          edited: false,
                        }
                        setComments([...comments, newC])
                        setNewComment("")
                      }
                    }}
                  >
                    Add Comment
                  </Button>
                </div>

                <ScrollArea className="h-[300px]">
                  {comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      userId={userId}
                      replyingTo={replyingTo}
                      newComment={newComment}
                      setReplyingTo={setReplyingTo}
                      setNewComment={setNewComment}
                      handleReply={(parentId, replyContent) => {
                        const updated = comments.map((com) => {
                          if (com.id === parentId) {
                            return {
                              ...com,
                              replies: [
                                ...com.replies,
                                {
                                  id: Date.now().toString(),
                                  userId,
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
                          return com
                        })
                        setComments(updated)
                        setReplyingTo(null)
                        setNewComment("")
                      }}
                      editingCommentId={editingCommentId}
                      editedCommentContent={editedCommentContent}
                      setEditingCommentId={setEditingCommentId}
                      setEditedCommentContent={setEditedCommentContent}
                      handleEditComment={(commentId, newContent) => {
                        const updated = comments.map((com) => {
                          if (com.id === commentId) {
                            return { ...com, content: newContent, edited: true }
                          }
                          return {
                            ...com,
                            replies: com.replies.map((rep) =>
                              rep.id === commentId
                                ? { ...rep, content: newContent, edited: true }
                                : rep
                            ),
                          }
                        })
                        setComments(updated)
                        setEditingCommentId(null)
                      }}
                      handleDeleteComment={(commentId) => {
                        const updated = comments.filter((com) => {
                          if (com.id === commentId) return false
                          // remove from replies
                          com.replies = com.replies.filter((r) => r.id !== commentId)
                          return true
                        })
                        setComments(updated)
                      }}
                      handleVote={(commentId, type) => {
                        const updated = comments.map((com) => {
                          if (com.id === commentId) {
                            return {
                              ...com,
                              upvotes: type === "upvote" ? com.upvotes + 1 : com.upvotes,
                              downvotes: type === "downvote" ? com.downvotes + 1 : com.downvotes,
                            }
                          }
                          // also check replies
                          com.replies = com.replies.map((rep) => {
                            if (rep.id === commentId) {
                              return {
                                ...rep,
                                upvotes: type === "upvote" ? rep.upvotes + 1 : rep.upvotes,
                                downvotes: type === "downvote" ? rep.downvotes + 1 : rep.downvotes,
                              }
                            }
                            return rep
                          })
                          return com
                        })
                        setComments(updated)
                      }}
                      depth={0}
                    />
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}

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
                        <img
                          src={question.markscheme}
                          alt="Markscheme image"
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

// Nested comment item
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
              <p className="font-semibold">{comment.username}</p>
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
            <p className="mt-2">{comment.content}</p>
          )}

          <div className="mt-2 flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleVote(comment.id, "upvote")}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
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
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
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
                  className="text-gray-500 hover:text-blue-300"
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
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

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

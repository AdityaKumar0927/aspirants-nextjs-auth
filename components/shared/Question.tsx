"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { Checkbox } from '@/components/ui/checkbox'
import MathRenderer from '@/components/layout/MathRenderer'
import { BookOpen, LucideBot, X, MessageSquare, ThumbsUp, ThumbsDown, Edit, Trash2, Reply, CornerDownRight, Flag } from 'lucide-react'
import Image from 'next/image'
import Tiptap from '@/components/layout/Tiptap'
import Chat from '@/components/shared/Chat'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import SettingsPopover from '@/components/ui/SettingsPopover'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import FeedbackPopover from './FeedbackPopover'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface QuestionType {
  exam: String
  questionId: string
  text: string
  subject: string
  difficulty: string
  year: string
  type: 'Multiple Choice' | 'Numerical'
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  diagramUrl?: string
  relatedResources?: { title: string; url: string }[]
  customTags?: string[]
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
  handleMarkForReview: (questionId: string) => void
  handleMarkComplete: (questionId: string) => void
  isMarkedForReview: boolean
  isMarkedComplete: boolean
  markschemesDisabled: boolean
  note: string
  handleNoteChange: (questionId: string, note: string) => void
  userId: string
  handleDeleteNote: (questionId: string) => Promise<void>
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
  userId,
  handleDeleteNote,
  onNextQuestion,
  onPreviousQuestion,
  totalQuestions,
  currentQuestionIndex,
  handleQuestionChange,
}: QuestionProps) {
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(
    selectedOption || null
  )
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)
  const [showNotes, setShowNotes] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editedCommentContent, setEditedCommentContent] = useState('')
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>(
    'newest'
  )
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [newTag, setNewTag] = useState('')
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(
    question.customTags || []
  )
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)

  const { toast, dismiss } = useToast()

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  const handleOptionClickLocal = (option: string) => {
    if (localSelectedOption !== option) {
      setLocalSelectedOption(option)
      handleOptionClick(question.questionId, option, question.correctOption || '')
      saveProgress(question.questionId, 'completed', true)
      updatePoints(option === question.correctOption)
    }
  }

  const handleNumericalSubmitLocal = () => {
    handleNumericalSubmit(
      question.questionId,
      numericalAnswer || '',
      question.correctOption || ''
    )
    saveProgress(question.questionId, 'completed', true)
    updatePoints(numericalAnswer === question.correctOption)
  }

  const updatePoints = (isCorrect: boolean) => {
    if (isCorrect) {
      setPoints((prevPoints) => prevPoints + 10)
      setStreak((prevStreak) => prevStreak + 1)
      if (streak + 1 === 5) {
        toast({
          title: 'Achievement Unlocked!',
          description: "You've answered 5 questions correctly in a row!",
          duration: 5000,
        })
      }
    } else {
      setStreak(0)
    }
  }

  const toggleMarkscheme = () => {
    setShowMarkschemeModal(!showMarkschemeModal)
    handleMarkschemeToggle(question.questionId)
  }

  const handleMarkschemeSwitch = () => {
    setMarkschemeEnabled(!markschemeEnabled)
  }

  const saveNote = async () => {
    try {
      const response = await fetch(`/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questionId: question.questionId, 
          content: note,
          title: `Note for Question ${question.questionId}`,
          type: 'text'
        }),
      })
      if (!response.ok) throw new Error('Failed to save note')
      toast({
        title: 'Note Saved',
        description: 'Your note has been saved successfully.',
      })
    } catch (error) {
      console.error('Error saving note:', error)
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const deleteNote = async () => {
    try {
      const response = await fetch(`/api/notes/${question.questionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete note')
      toast({
        title: 'Note Deleted',
        description: 'Your note has been deleted successfully.',
      })
      handleNoteChange(question.questionId, '')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const saveProgress = async (
    questionId: string,
    field: string,
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/user-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, [field]: value }),
      })
      if (!response.ok) throw new Error('Failed to save progress')
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleMarkCompleteLocal = async (questionId: string) => {
    await handleMarkComplete(questionId)
    saveProgress(questionId, 'completed', !isMarkedComplete)
    toast({
      title: 'Question Completed',
      description: `You have completed question ${questionId}.`,
      duration: 5000,
      action: (
        <ToastAction
          onClick={() => undoMarkComplete(questionId)}
          altText="Undo"
        >
          Undo
        </ToastAction>
      ),
    })
  }

  const handleMarkForReviewLocal = async (questionId: string) => {
    await handleMarkForReview(questionId)
    saveProgress(questionId, 'reviewed', !isMarkedForReview)
    toast({
      title: 'Question Flagged for Review',
      description: `You have flagged question ${questionId} for review.`,
      duration: 5000,
      action: (
        <ToastAction
          onClick={() => undoMarkForReview(questionId)}
          altText="Undo"
        >
          Undo
        </ToastAction>
      ),
    })
  }

  const undoMarkComplete = async (questionId: string) => {
    await handleMarkComplete(questionId)
    saveProgress(questionId, 'completed', false)
    dismiss()
  }

  const undoMarkForReview = async (questionId: string) => {
    await handleMarkForReview(questionId)
    saveProgress(questionId, 'reviewed', false)
    dismiss()
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: CommentType = {
        id: Date.now().toString(),
        userId,
        username: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
        replies: [],
        upvotes: 0,
        downvotes: 0,
        edited: false,
      }
      setComments([...comments, newCommentObj])
      setNewComment('')
    }
  }

  const handleReply = (parentId: string, replyContent: string) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [
            ...comment.replies,
            {
              id: Date.now().toString(),
              userId,
              username: 'Current User',
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
      return comment
    })

    setComments(updatedComments)
    setReplyingTo(null)
  }

  const handleEditComment = (commentId: string, newContent: string) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, content: newContent, edited: true }
      }
      return {
        ...comment,
        replies: comment.replies.map((reply) =>
          reply.id === commentId ? { ...reply, content: newContent, edited: true } : reply
        ),
      }
    })
    setComments(updatedComments)
    setEditingCommentId(null)
  }

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter((comment) => {
      if (comment.id === commentId) {
        return false
      }
      comment.replies = comment.replies.filter((reply) => reply.id !== commentId)
      return true
    })
    setComments(updatedComments)
  }

  const handleVote = (commentId: string, voteType: 'upvote' | 'downvote') => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          upvotes: voteType === 'upvote' ? comment.upvotes + 1 : comment.upvotes,
          downvotes: voteType === 'downvote' ? comment.downvotes + 1 : comment.downvotes,
        }
      }
      comment.replies = comment.replies.map((reply) =>
        reply.id === commentId
          ? {
              ...reply,
              upvotes: voteType === 'upvote' ? reply.upvotes + 1 : reply.upvotes,
              downvotes: voteType === 'downvote' ? reply.downvotes + 1 : reply.downvotes,
            }
          : reply
      )
      return comment
    })
    setComments(updatedComments)
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    } else if (commentSort === 'oldest') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    } else {
      return b.upvotes - a.upvotes
    }
  })

  const renderComment = (comment: CommentType, isReply = false, depth = 0) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-6' : 'border-t'} pt-4 ${depth > 0 ? 'mt-4' : ''}`}
    >
      <div className="flex items-start space-x-2">
        {isReply && <CornerDownRight className="h-6 w-6 text-gray-400 mt-2" />}
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${comment.username}`}
              />
              <AvatarFallback>
                {comment.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{comment.username}</p>
              <p className="text-sm text-gray-500">
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
                  onClick={() => handleVote(comment.id, 'upvote')}
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
                  onClick={() => handleVote(comment.id, 'downvote')}
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
                  className="text-gray-500 hover:text-blue-500"
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
      {comment.replies.map((reply) => renderComment(reply, true, depth + 1))}
    </div>
  )

  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  })

  const handleAddTag = () => {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalCustomTags(localCustomTags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <TooltipProvider>
      <div {...handlers} className="relative pb-20">
        <Card className="w-full overflow-hidden mb-6">
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="font-normal text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
                  Question {question.questionId}
                </CardTitle>
                <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  {question.subject}
                </div>
                <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  {question.difficulty}
                </div>
                <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  {question.year}
                </div>
                <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  {question.type}
                </div>
                <div className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  {question.exam}
                </div>
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
                        <X className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new tag</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Checkbox
                      id={`complete-${question.questionId}`}
                      checked={isMarkedComplete}
                      onCheckedChange={() => handleMarkCompleteLocal(question.questionId)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Mark as Complete</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkForReviewLocal(question.questionId)}
                    >
                      <Flag
                        className={
                          isMarkedForReview
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-500'
                        }
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Flag for Review</TooltipContent>
                </Tooltip>
                <SettingsPopover
                  markschemeEnabled={markschemeEnabled}
                  setMarkschemeEnabled={handleMarkschemeSwitch}
                  aiEnabled={aiEnabled}
                  setAiEnabled={setAiEnabled}
                  notesEnabled={notesEnabled}
                  setNotesEnabled={setNotesEnabled}
                />
                <FeedbackPopover questionId={question.questionId} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              {question.diagramUrl && question.diagramUrl !== '' && (
                <div className="relative w-64 h-64 mb-4 mx-auto">
                  <Image
                    src={question.diagramUrl}
                    alt={`Diagram for question ${question.questionId}`}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-md"
                  />
                </div>
              )}
              <p className="text-gray-700 mb-4 text-base sm:text-lg md:text-xl leading-7 [&:not(:first-child)]:mt-6">
                <MathRenderer text={question.text} />
              </p>
            </div>
            {question.type === 'Numerical' && (
              <div className="mb-4">
                <Input
                  type="text"
                  className="w-full p-2 border rounded text-base sm:text-lg"
                  placeholder="Write your answer here..."
                  value={numericalAnswer}
                  onChange={(e) =>
                    handleNumericalChange(question.questionId, e.target.value)
                  }
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="mt-2" onClick={handleNumericalSubmitLocal}>
                      Submit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Submit your answer</TooltipContent>
                </Tooltip>
              </div>
            )}
            {question.type === 'Multiple Choice' && (
              <div className="space-y-2 mb-4">
                {question.options?.map((option: string, index: number) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          localSelectedOption === String.fromCharCode(65 + index)
                            ? 'default'
                            : 'outline'
                        }
                        className={`w-full justify-start text-left text-base sm:text-lg p-4 leading-7 [&:not(:first-child)]:mt-6 ${
                          localSelectedOption === String.fromCharCode(65 + index) &&
                          feedback
                            ? feedback === 'correct'
                              ? 'bg-green-100 hover:bg-green-200 text-green-700'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                            : ''
                        }`}
                        onClick={() =>
                          handleOptionClickLocal(String.fromCharCode(65 + index))
                        }
                      >
                        <span className="mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <div className="font-serif">
                          {option.startsWith('http') ? (
                            <div className="relative w-full h-64">
                              <Image
                                src={option}
                                alt={`Option ${String.fromCharCode(65 + index)} image`}
                                layout="fill"
                                objectFit="contain"
                                className="rounded-md"
                              />
                            </div>
                          ) : (
                            <MathRenderer text={option} />
                          )}
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select this option</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
            {feedback && (
              <div
                className={`mt-4 p-2 rounded ${
                  feedback === 'correct'
                    ? 'bg-green-100 text-green-700'
                    : feedback === 'incorrect'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {feedback === 'correct'
                  ? 'Correct!'
                  : feedback === 'incorrect'
                  ? 'Incorrect, try again.'
                  : 'No answer available'}
              </div>
            )}
            {localSelectedOption && markschemeEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="mt-4" onClick={toggleMarkscheme}>
                    Show Markscheme
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View the markscheme</TooltipContent>
              </Tooltip>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setShowNotes(!showNotes)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {showNotes ? 'Hide Notes' : 'Take Notes'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showNotes ? 'Hide note-taking interface' : 'Open note-taking interface'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setShowAI(!showAI)}>
                    <LucideBot className="mr-2 h-4 w-4" />
                    {showAI ? 'Hide AI' : 'AI Assistance'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showAI ? 'Hide AI assistant' : 'Get AI help'}
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>

          {showNotes && (
            <CardContent>
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Add your notes for this question here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tiptap
                    content={note}
                    onUpdate={(content) =>
                      handleNoteChange(question.questionId, content)
                    }
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={saveNote}>
                        Save Note
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save your note</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={deleteNote}>
                        Delete Note
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete your note</TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
            </CardContent>
          )}

          {showAI && (
            <CardContent>
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>
                    Ask for help or clarification on this question.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <Chat 
                    questionId={question.questionId}
                    questionText={question.text}
                    options={question.options}
                    markscheme={question.markscheme}
                  />
                </CardContent>
              </Card>
            </CardContent>
          )}

          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {showComments ? 'Hide Comments' : 'Show Comments'}
              </Button>
              {showComments && (
                <Select
                  value={commentSort}
                  onValueChange={(value) =>
                    setCommentSort(value as 'newest' | 'oldest' | 'popular')
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
              )}
            </div>
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-4">
                        <Label htmlFor="newComment">Add a comment</Label>
                        <Textarea
                          id="newComment"
                          placeholder="Write your comment here..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full mt-2"
                        />
                        <Button onClick={handleAddComment} className="mt-2">
                          Post Comment
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px]">
                        {sortedComments.map((comment) => renderComment(comment))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <AnimatePresence>
          {showMarkschemeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold mb-4">Markscheme</h2>
                <div className="prose max-w-none">
                  <MathRenderer text={question.markscheme || ''} />
                </div>
                <Button onClick={toggleMarkscheme} className="mt-4">
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
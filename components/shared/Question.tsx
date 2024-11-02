'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { Checkbox } from '@/components/ui/checkbox'
import MathRenderer from '@/components/layout/MathRenderer'
import {
  LucideBookmark,
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
  Sun,
  Maximize2,
  Minimize2,
  Trophy,
  Download,
  Star,
  Tag,
  Grid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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
import { MorePopover } from '@/components/layout/MorePopover'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  year: string;
  type: 'Multiple Choice' | 'Numerical';
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
  diagramUrl?: string;
  relatedResources?: { title: string; url: string }[];
  customTags?: string[];
}

interface CommentType {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  replies: CommentType[];
  upvotes: number;
  downvotes: number;
  edited: boolean;
}

interface QuestionProps {
  question: QuestionType;
  feedback: string | undefined;
  selectedOption: string | undefined;
  numericalAnswer: string | undefined;
  showMarkscheme: boolean | undefined;
  handleOptionClick: (
    questionId: string,
    option: string,
    correctOption: string
  ) => void;
  handleNumericalSubmit: (
    questionId: string,
    userAnswer: string,
    correctAnswer: string
  ) => void;
  handleNumericalChange: (questionId: string, value: string) => void;
  handleMarkschemeToggle: (questionId: string) => void;
  handleMarkForReview: (questionId: string) => void;
  handleMarkComplete: (questionId: string) => void;
  isMarkedForReview: boolean;
  isMarkedComplete: boolean;
  markschemesDisabled: boolean;
  note: string;
  handleNoteChange: (questionId: string, note: string) => void;
  userId: string;
  handleDeleteNote: (questionId: string) => Promise<void>;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  totalQuestions: number;
  currentQuestionIndex: number;
  handleQuestionChange: (index: number) => void;
}

export default function Component({
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
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [hintsEnabled, setHintsEnabled] = useState(false)
  const [solutionsEnabled, setSolutionsEnabled] = useState(false)
  const [showStepByStep, setShowStepByStep] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)
  const [progressTrackingEnabled, setProgressTrackingEnabled] = useState(true)
  const [examModeEnabled, setExamModeEnabled] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editedCommentContent, setEditedCommentContent] = useState('')
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [distractionFreeMode, setDistractionFreeMode] = useState(false)
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  const [comingSoonMessage, setComingSoonMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'notes' | 'ai'>('notes')
  const [language, setLanguage] = useState('en')
  const [isOffline, setIsOffline] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userDifficulty, setUserDifficulty] = useState(0)
  const [newTag, setNewTag] = useState('')
  const [showQuestionGrid, setShowQuestionGrid] = useState(false)
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || [])

  const { toast, dismiss } = useToast()

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.questionId, content: note }),
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
      await handleDeleteNote(question.questionId)
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
      title: 'Question Bookmarked',
      description: `You have bookmarked question ${questionId}.`,
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

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    handleNoteChange(question.questionId, `Template: ${value}

${note}`)
  }

  const exportNote = () => {
    const element = document.createElement('a')
    const file = new Blob([note], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `note_${question.questionId}.txt`
    document.body.appendChild(element)
    element.click()
  }

  const toggleExamMode = () => {
    setExamModeEnabled(!examModeEnabled)
    if (!examModeEnabled) {
      setAiEnabled(false)
      setNotesEnabled(false)
    }
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

  const toggleDistractionFreeMode = () => {
    setDistractionFreeMode(!distractionFreeMode)
  }

  const showComingSoon = (feature: string) => {
    setComingSoonMessage(`${feature} is coming soon!`)
    setShowComingSoonModal(true)
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    // Here you would typically fetch the translated content for the question
    // and update the state accordingly
  }

  const handleDownloadForOffline = () => {
    // Implement the logic to download the question for offline use
    toast({
      title: 'Question Downloaded',
      description: 'This question is now available offline.',
    })
  }

  const handleRatingChange = (newRating: number) => {
    setUserRating(newRating)
    // Here you would typically send this rating to your backend
  }

  const handleDifficultyChange = (newDifficulty: number) => {
    setUserDifficulty(newDifficulty)
    // Here you would typically send this difficulty rating to your backend
  }

  const handleAddTag = () => {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalCustomTags(localCustomTags.filter(tag => tag !== tagToRemove))
  }

  const renderQuestionGrid = () => {
    const columns = 5
    const rows = Math.ceil(totalQuestions / columns)

    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <Button
            key={index}
            variant={index === currentQuestionIndex ? 'default' : 'outline'}
            className={`w-full h-12 ${
              index === currentQuestionIndex ? 'bg-primary text-primary-foreground' : ''
            }`}
            onClick={() => handleQuestionChange(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div {...handlers} className="relative min-h-screen pb-20">
        <Card className="w-full overflow-hidden mb-6">
          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
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
                        <Tag className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new tag</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {!distractionFreeMode && (
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
                      <LucideBookmark
                        className={
                          isMarkedForReview ? 'fill-yellow-700' : 'text-yellow-700'
                        }
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bookmark for Review</TooltipContent>
                </Tooltip>
                <SettingsPopover
                  markschemeEnabled={markschemeEnabled}
                  setMarkschemeEnabled={handleMarkschemeSwitch}
                  aiEnabled={aiEnabled}
                  setAiEnabled={setAiEnabled}
                  notesEnabled={notesEnabled}
                  setNotesEnabled={setNotesEnabled}
                  timerEnabled={timerEnabled}
                  setTimerEnabled={setTimerEnabled}
                  hintsEnabled={hintsEnabled}
                  setHintsEnabled={setHintsEnabled}
                  solutionsEnabled={solutionsEnabled}
                  setSolutionsEnabled={setSolutionsEnabled}
                  showStepByStep={showStepByStep}
                  setShowStepByStep={setShowStepByStep}
                  darkModeEnabled={darkModeEnabled}
                  setDarkModeEnabled={setDarkModeEnabled}
                  progressTrackingEnabled={progressTrackingEnabled}
                  setProgressTrackingEnabled={setProgressTrackingEnabled}
                />
                <MorePopover />
              </div>              
              )}
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
                    objectFit="cover"
                    className="rounded-m"
                  />
                </div>
              )}
              <p className="text-gray-700 mb-4 text-base sm:text-lg md:text-xl">
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
                  onChange={(e) => handleNumericalChange(question.questionId, e.target.value)}
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
                        className={`w-full justify-start text-left text-base sm:text-lg p-4 ${
                          localSelectedOption === String.fromCharCode(65 + index) && feedback
                            ? feedback === 'correct'
                              ? 'bg-green-100 hover:bg-green-200 text-green-700'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                            : ''
                        }`}
                        onClick={() =>
                          handleOptionClickLocal(String.fromCharCode(65 + index))
                        }
                      >
                        <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                        <MathRenderer text={option} />
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
            {localSelectedOption && markschemeEnabled && !examModeEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="mt-4" onClick={toggleMarkscheme}>
                    Show Markscheme
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View the markscheme</TooltipContent>
              </Tooltip>
            )}
          </CardContent>
          {!distractionFreeMode && (
            <CardFooter className="flex flex-col">
              <div className="w-full flex justify-between items-center mb-4">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as 'notes' | 'ai')}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="notes" disabled={examModeEnabled}>
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="ai" disabled={examModeEnabled}>
                      AI Assistant
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'notes' | 'ai')}
                className="w-full"
              >
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                      <CardDescription>Add your notes for this question here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label htmlFor="template-select">Select Template</Label>
                        <Select onValueChange={handleTemplateChange}>
                          <SelectTrigger id="template-select">
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meeting">Meeting Notes</SelectItem>
                            <SelectItem value="project">Project Plan</SelectItem>
                            <SelectItem value="study">Study Notes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Tiptap
                        content={note}
                        onUpdate={(content) => handleNoteChange(question.questionId, content)}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={exportNote}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export your note</TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="ai">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Assistant</CardTitle>
                      <CardDescription>
                        Ask for help or clarification on this question.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Chat questionText={question.text} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="text-sm mt-4"
                  >
                    Comments ({comments.length})
                    <MessageSquare className="ml-2 h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View and add comments</TooltipContent>
              </Tooltip>
              {showComments && (
                <Card className="mt-4 w-full">
                  <CardHeader>
                    <CardTitle>Comments</CardTitle>
                    <CardDescription>Discuss this question with others.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Label htmlFor="comment-sort">Sort by</Label>
                      <Select
                        value={commentSort}
                        onValueChange={(value: 'newest' | 'oldest' | 'popular') =>
                          setCommentSort(value)
                        }
                      >
                        <SelectTrigger id="comment-sort">
                          <SelectValue placeholder="Sort comments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {sortedComments.map((comment) => renderComment(comment))}
                      </div>
                    </ScrollArea>
                    <div className="mt-4">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleAddComment} className="mt-2">
                            Post Comment
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Post your comment</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardFooter>
          )}
        </Card>
        <AnimatePresence>
          {showMarkschemeModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            >
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>Markscheme</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4"
                        onClick={() => setShowMarkschemeModal(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close markscheme</TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[60vh]">
                    <p className="mb-2">
                      {question.markscheme ? (
                        <MathRenderer text={question.markscheme} />
                      ) : (
                        'No answer available'
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="fixed top-20 left-4 space-x-2">
          <Badge variant="secondary">Points: {points}</Badge>
          <Badge variant="secondary">Streak: {streak}</Badge>
        </div>
      </div>
    </TooltipProvider>
  )
}
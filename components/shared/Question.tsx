'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Checkbox } from '@/components/ui/checkbox';
import MathRenderer from '@/components/layout/MathRenderer';
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
  PenLine,
  Flag,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import Tiptap from '@/components/layout/Tiptap';
import Chat from '@/components/shared/Chat';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import SettingsPopover from '@/components/ui/SettingsPopover';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { MorePopover } from '@/components/layout/MorePopover';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

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

const Question: React.FC<QuestionProps> = ({
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
}) => {
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(
    selectedOption || null
  );
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notesEnabled, setNotesEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [solutionsEnabled, setSolutionsEnabled] = useState(false);
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [progressTrackingEnabled, setProgressTrackingEnabled] = useState(true);
  const [examModeEnabled, setExamModeEnabled] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [distractionFreeMode, setDistractionFreeMode] = useState(false);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonMessage, setComingSoonMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('en');
  const [isOffline, setIsOffline] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userDifficulty, setUserDifficulty] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [localCustomTags, setLocalCustomTags] = useState<string[]>(question.customTags || []);
  const [showNotesOrAI, setShowNotesOrAI] = useState<'notes' | 'ai' | null>(null);

  const { toast, dismiss } = useToast();

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null);
  }, [selectedOption]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOptionClickLocal = (option: string) => {
    if (localSelectedOption !== option) {
      setLocalSelectedOption(option);
      handleOptionClick(question.questionId, option, question.correctOption || '');
      saveProgress(question.questionId, 'completed', true);
      updatePoints(option === question.correctOption);
    }
  };

  const handleNumericalSubmitLocal = () => {
    handleNumericalSubmit(
      question.questionId,
      numericalAnswer || '',
      question.correctOption || ''
    );
    saveProgress(question.questionId, 'completed', true);
    updatePoints(numericalAnswer === question.correctOption);
  };

  const updatePoints = (isCorrect: boolean) => {
    if (isCorrect) {
      setPoints((prevPoints) => prevPoints + 10);
      setStreak((prevStreak) => prevStreak + 1);
      if (streak + 1 === 5) {
        toast({
          title: 'Achievement Unlocked!',
          description: "You've answered 5 questions correctly in a row!",
          duration: 5000,
        });
      }
    } else {
      setStreak(0);
    }
  };

  const toggleMarkscheme = () => {
    setShowMarkschemeModal(!showMarkschemeModal);
    handleMarkschemeToggle(question.questionId);
  };

  const handleMarkschemeSwitch = () => {
    setMarkschemeEnabled(!markschemeEnabled);
  };

  const saveNote = async () => {
    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.questionId, content: note }),
      });
      if (!response.ok) throw new Error('Failed to save note');
      toast({
        title: 'Note Saved',
        description: 'Your note has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteNote = async () => {
    try {
      await handleDeleteNote(question.questionId);
      toast({
        title: 'Note Deleted',
        description: 'Your note has been deleted successfully.',
      });
      handleNoteChange(question.questionId, '');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
      });
      if (!response.ok) throw new Error('Failed to save progress');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleMarkCompleteLocal = async (questionId: string) => {
    await handleMarkComplete(questionId);
    saveProgress(questionId, 'completed', !isMarkedComplete);
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
    });
  };

  const handleMarkForReviewLocal = async (questionId: string) => {
    await handleMarkForReview(questionId);
    saveProgress(questionId, 'reviewed', !isMarkedForReview);
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
    });
  };

  const undoMarkComplete = async (questionId: string) => {
    await handleMarkComplete(questionId);
    saveProgress(questionId, 'completed', false);
    dismiss();
  };

  const undoMarkForReview = async (questionId: string) => {
    await handleMarkForReview(questionId);
    saveProgress(questionId, 'reviewed', false);
    dismiss();
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    handleNoteChange(question.questionId, `Template: ${value}

${note}`);
  };

  const exportNote = () => {
    const element = document.createElement('a');
    const file = new Blob([note], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `note_${question.questionId}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const toggleExamMode = () => {
    setExamModeEnabled(!examModeEnabled);
    if (!examModeEnabled) {
      setAiEnabled(false);
      setNotesEnabled(false);
    }
  };

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
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };

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
        };
      }
      return comment;
    });
    setComments(updatedComments);
    setReplyingTo(null);
  };

  const handleEditComment = (commentId: string, 
    newContent: string) => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, content: newContent, edited: true };
      }
      return {
        ...comment,
        replies: comment.replies.map((reply) =>
          reply.id === commentId ? { ...reply, content: newContent, edited: true } : reply
        ),
      };
    });
    setComments(updatedComments);
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter((comment) => {
      if (comment.id === commentId) {
        return false;
      }
      comment.replies = comment.replies.filter((reply) => reply.id !== commentId);
      return true;
    });
    setComments(updatedComments);
  };

  const handleVote = (commentId: string, voteType: 'upvote' | 'downvote') => {
    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          upvotes: voteType === 'upvote' ? comment.upvotes + 1 : comment.upvotes,
          downvotes: voteType === 'downvote' ? comment.downvotes + 1 : comment.downvotes,
        };
      }
      comment.replies = comment.replies.map((reply) =>
        reply.id === commentId
          ? {
              ...reply,
              upvotes: voteType === 'upvote' ? reply.upvotes + 1 : reply.upvotes,
              downvotes: voteType === 'downvote' ? reply.downvotes + 1 : reply.downvotes,
            }
          : reply
      );
      return comment;
    });
    setComments(updatedComments);
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (commentSort === 'oldest') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else {
      return b.upvotes - a.upvotes;
    }
  });

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
                        setEditingCommentId(comment.id);
                        setEditedCommentContent(comment.content);
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
  );

  const handlers = useSwipeable({
    onSwipedLeft: () => onNextQuestion && onNextQuestion(),
    onSwipedRight: () => onPreviousQuestion && onPreviousQuestion(),
    trackMouse: true,
  });

  const toggleDistractionFreeMode = () => {
    setDistractionFreeMode(!distractionFreeMode);
  };

  const showComingSoon = (feature: string) => {
    setComingSoonMessage(`${feature} is coming soon!`);
    setShowComingSoonModal(true);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Here you would typically fetch the translated content for the question
    // and update the state accordingly
  };

  const handleDownloadForOffline = () => {
    // Implement the logic to download the question for offline use
    toast({
      title: 'Question Downloaded',
      description: 'This question is now available offline.',
    });
  };

  const handleRatingChange = (newRating: number) => {
    setUserRating(newRating);
    // Here you would typically send this rating to your backend
  };

  const handleDifficultyChange = (newDifficulty: number) => {
    setUserDifficulty(newDifficulty);
    // Here you would typically send this difficulty rating to your backend
  };

  const handleAddTag = () => {
    if (newTag && !localCustomTags.includes(newTag)) {
      setLocalCustomTags([...localCustomTags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalCustomTags(localCustomTags.filter(tag => tag !== tagToRemove));
  };

  const renderQuestionGrid = () => {
    const columns = 5;
    const rows = Math.ceil(totalQuestions / columns);

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
    );
  };

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
                    className="rounded-md"
                  />
                </div>
              )}
              <p className="text-gray-700 mb-4">{question.text}</p>
              <MathRenderer text={question.text} />
            </div>
            {question.type === 'Multiple Choice' && (
              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name={`question-${question.questionId}`}
                      value={option}
                      checked={localSelectedOption === option}
                      onChange={() => handleOptionClickLocal(option)}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <label htmlFor={`option-${index}`} className="ml-2">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}
            {question.type === 'Numerical' && (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={numericalAnswer}
                  onChange={(e) =>
                    handleNumericalChange(question.questionId, e.target.value)
                  }
                  placeholder="Enter your answer"
                  className="w-40"
                />
                <Button onClick={handleNumericalSubmitLocal}>Submit</Button>
              </div>
            )}
            {feedback && (
              <p
                className={`mt-4 ${
                  feedback === 'correct' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Your answer is {feedback}.
              </p>
            )}
            {showMarkscheme && question.markscheme && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Markscheme:</h3>
                <p>{question.markscheme}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setShowNotesOrAI(showNotesOrAI === 'notes' ? null : 'notes')}
                      disabled={examModeEnabled}
                    >
                      <PenLine className="mr-2 h-4 w-4" />
                      Take a Note
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open note-taking area</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setShowNotesOrAI(showNotesOrAI === 'ai' ? null : 'ai')}
                      disabled={examModeEnabled}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      AI Assistance
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open AI assistance</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleMarkForReview(question.questionId)}>
                  <Flag className={`w-4 h-4 mr-2 ${isMarkedForReview ? "text-yellow-500" : ""}`} />
                  {isMarkedForReview ? "Marked for Review" : "Mark for Review"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleMarkComplete(question.questionId)}>
                  <Check className={`w-4 h-4 mr-2 ${isMarkedComplete ? "text-green-500" : ""}`} />
                  {isMarkedComplete ? "Completed" : "Mark Complete"}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleMarkscheme} disabled={markschemesDisabled}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {showMarkscheme ? "Hide Markscheme" : "Show Markscheme"}
                </Button>
              </div>
            </div>
            {showNotesOrAI && (
              <Card className="w-full mt-4">
                <CardHeader>
                  <CardTitle>{showNotesOrAI === 'notes' ? 'Notes' : 'AI Assistant'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {showNotesOrAI === 'notes' ? (
                    <>
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
                      <div className="flex justify-between mt-4">
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
                      </div>
                    </>
                  ) : (
                    <Chat questionText={question.text} />
                  )}
                </CardContent>
              </Card>
            )}
            <div className="w-full flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={onPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <Button
                variant="outline"
                onClick={onNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={toggleExamMode}>
                    {examModeEnabled ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <LucideBot className="h-4 w-4 mr-2" />
                    )}
                    {examModeEnabled ? 'Exit Exam Mode' : 'Enter Exam Mode'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {examModeEnabled
                    ? 'Exit exam mode to enable AI and notes'
                    : 'Enter exam mode to disable AI and notes'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={toggleDistractionFreeMode}>
                    {distractionFreeMode ? (
                      <Minimize2 className="h-4 w-4 mr-2" />
                    ) : (
                      <Maximize2 className="h-4 w-4 mr-2" />
                    )}
                    {distractionFreeMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {distractionFreeMode
                    ? 'Exit focus mode to show all UI elements'
                    : 'Enter focus mode to hide distracting UI elements'}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => showComingSoon('Leaderboard')}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View the leaderboard</TooltipContent>
              </Tooltip>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium">Points: {points}</span>
                  </TooltipTrigger>
                  <TooltipContent>Your current points</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium">Streak: {streak}</span>
                  </TooltipTrigger>
                  <TooltipContent>Your current streak</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showComingSoonModal} onOpenChange={setShowComingSoonModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming Soon</DialogTitle>
            <DialogDescription>{comingSoonMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog open={showMarkschemeModal} onOpenChange={setShowMarkschemeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Markscheme</DialogTitle>
          </DialogHeader>
          <p>{question.markscheme}</p>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {showQuestionGrid && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowQuestionGrid(false)}
          >
            <motion.div
              className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Question Navigator</h2>
              {renderQuestionGrid()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Question Grid</TooltipContent>
        </Tooltip>
      </div>
      {showComments && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <div className="flex justify-between items-center">
              <Select
                value={commentSort}
                onValueChange={(value) => setCommentSort(value as 'newest' | 'oldest' | 'popular')}
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedComments.map((comment) => renderComment(comment))}
            </div>
            <div className="mt-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleAddComment} className="mt-2">
                Post Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {question.relatedResources && question.relatedResources.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Related Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {question.relatedResources.map((resource, index) => (
                <li key={index}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {resource.title}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Question Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Rate this question:</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className={`text-2xl ${
                      star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="difficulty">Rate the difficulty:</Label>
              <Slider
                id="difficulty"
                min={1}
                max={10}
                step={1}
                value={[userDifficulty]}
                onValueChange={(value) => handleDifficultyChange(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default Question;
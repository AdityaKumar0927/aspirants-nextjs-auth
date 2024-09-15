'use client'

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import MathRenderer from "@/components/layout/MathRenderer"
import { LucideBookmark, BookOpen, LucideBot, MoreVertical, X, ChevronDown, ChevronUp, Check, FileText, Download, History, BarChart2 } from "lucide-react"
import Image from "next/image"
import Tiptap from "@/components/layout/Tiptap"
import Chat from "@/components/shared/Chat"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import SettingsPopover from "@/components/ui/SettingsPopover"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { MorePopover } from "@/components/layout/MorePopover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QuestionType {
  questionId: string
  text: string
  subject: string
  difficulty: string
  type: "Multiple Choice" | "Numerical"
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  diagramUrl?: string
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
  handleMarkForReview: (questionId: string) => void
  handleMarkComplete: (questionId: string) => void
  isMarkedForReview: boolean
  isMarkedComplete: boolean
  markschemesDisabled: boolean
  note: string
  handleNoteChange: (questionId: string, note: string) => void
  userId: string
  handleDeleteNote: (questionId: string) => Promise<void>
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
}) => {
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(selectedOption || null)
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false)
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled)
  const [showEditor, setShowEditor] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notesEnabled, setNotesEnabled] = useState(true)
  const [showAiChat, setShowAiChat] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [progress, setProgress] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showDataVisualization, setShowDataVisualization] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { toast, dismiss } = useToast()

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null)
  }, [selectedOption])

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleOptionClickLocal = (option: string) => {
    if (localSelectedOption !== option) {
      setLocalSelectedOption(option)
      handleOptionClick(question.questionId, option, question.correctOption || '')
      saveProgress(question.questionId, 'completed', true)
    }
  }

  const handleNumericalSubmitLocal = () => {
    handleNumericalSubmit(question.questionId, numericalAnswer || '', question.correctOption || '')
    saveProgress(question.questionId, 'completed', true)
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
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving note:', error)
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteNote = async () => {
    try {
      await handleDeleteNote(question.questionId)
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully.",
      })
      handleNoteChange(question.questionId, '')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveProgress = async (questionId: string, field: string, value: boolean) => {
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
      title: "Question Completed",
      description: `You have completed question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkComplete(questionId)} altText="Undo">Undo</ToastAction>,
    })
  }

  const handleMarkForReviewLocal = async (questionId: string) => {
    await handleMarkForReview(questionId)
    saveProgress(questionId, 'reviewed', !isMarkedForReview)
    toast({
      title: "Question Bookmarked",
      description: `You have bookmarked question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkForReview(questionId)} altText="Undo">Undo</ToastAction>,
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
    // Apply the selected template to the note
    // This is a placeholder and should be implemented based on your template system
    handleNoteChange(question.questionId, `Template: ${value}\n\n${note}`)
  }

  const exportNote = () => {
    const element = document.createElement("a")
    const file = new Blob([note], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `note_${question.questionId}.txt`
    document.body.appendChild(element)
    element.click()
  }

  const renderDataVisualization = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        // This is a placeholder for data visualization
        // You should implement actual data visualization based on your requirements
        ctx.fillStyle = 'rgb(200, 0, 0)'
        ctx.fillRect(10, 10, 50, 50)
        ctx.fillStyle = 'rgba(0, 0, 200, 0.5)'
        ctx.fillRect(30, 30, 50, 50)
      }
    }
  }

  useEffect(() => {
    if (showDataVisualization) {
      renderDataVisualization()
    }
  }, [showDataVisualization])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col mb-6"
      >
        <Card className="w-full overflow-hidden">
          <CardHeader className="relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute top-0 left-0 h-1 bg-primary"
            />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <CardTitle className="text-left font-display font-bold tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
                  Question {question.questionId}
                </CardTitle>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                >
                  {question.subject}
                </motion.span>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                >
                  {question.difficulty}
                </motion.span>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                >
                  {question.type}
                </motion.span>
              </div>
              <div className="flex items-center space-x-2">
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMarkForReviewLocal(question.questionId)}
                    >
                      <LucideBookmark className={`${isMarkedForReview ? 'fill-yellow-700' : 'text-yellow-700'}`} />
                    </motion.button>
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
                />
                <MorePopover />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  {isExpanded ? "Hide Question" : "Show Question"}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {question.diagramUrl && question.diagramUrl !== "" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="relative w-64 h-64 mb-4 mx-auto"
                        >
                          <Image
                            src={question.diagramUrl}
                            alt={`Diagram for question ${question.questionId}`}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                        </motion.div>
                      )}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-700 mb-4"
                      >
                        <MathRenderer text={question.text} />
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
            {question.type === 'Numerical' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Write your answer here..."
                  value={numericalAnswer}
                  onChange={(e) => handleNumericalChange(question.questionId, e.target.value)}
                />
                <Button className="mt-2" onClick={handleNumericalSubmitLocal}>
                  Submit
                </Button>
              </motion.div>
            )}
            {question.type === 'Multiple Choice' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2 mb-4"
              >
                {question.options?.map((option: string, index: number) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      className={`px-4 py-2 border-gray-500 border rounded w-full text-left ${
                        localSelectedOption === String.fromCharCode(65 + index)
                          ? feedback === 'correct'
                            ? 'bg-green-100 text-green-700'
                            : feedback === 'incorrect'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                          : 'bg-white text-gray-700'
                      }`}
                      onClick={() => handleOptionClickLocal(String.fromCharCode(65 + index))}
                    >
                      <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                      <MathRenderer text={option} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`mt-4 p-2 rounded ${feedback === 'correct' ? 'bg-green-100 text-green-700' : feedback === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
              >
                {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
              </motion.div>
            )}
            {localSelectedOption && markschemeEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button className="mt-4" onClick={toggleMarkscheme}>
                  Show Markscheme
                </Button>
              </motion.div>
            )}
          </CardContent>
          <CardFooter>
            <Tabs className="w-full" defaultValue="notes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              </TabsList>
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
                    <Tiptap content={note} onUpdate={(content) => handleNoteChange(question.questionId, content)} />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={saveNote}>Save Note</Button>
                    <Button variant="outline" onClick={deleteNote}>Delete Note</Button>
                    <Button variant="outline" onClick={exportNote}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <History className="mr-2 h-4 w-4" />
                          Version History
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Version History</DialogTitle>
                          <DialogDescription>
                            View and restore previous versions of your note.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Implement version history UI here */}
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <BarChart2 className="mr-2 h-4 w-4" />
                          Visualize Data
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Data Visualization</DialogTitle>
                          <DialogDescription>
                            Visualize data from your notes.
                          </DialogDescription>
                        </DialogHeader>
                        <canvas ref={canvasRef} width="400" height="200"></canvas>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>Ask for help or clarification on this question.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Chat questionText={question.text} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardFooter>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4"
                    onClick={() => setShowMarkschemeModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[60vh]">
                    <p className="mb-2">
                      {question.markscheme ? <MathRenderer text={question.markscheme} /> : 'No answer available'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  )
}

export default Question
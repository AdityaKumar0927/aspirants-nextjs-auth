"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Popover from "@/components/shared/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpIcon, ArrowDownIcon, ChevronDown, Search, Plus, Trash2, Edit, Eye, CheckCircle, XCircle, MoreHorizontal, Upload, FileUp, FileJson, Loader2 } from 'lucide-react'

type QuestionStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'

interface Question {
  questionId: string
  exam: string
  text: string
  subject: string
  topic: string
  subtopic: string | null
  difficulty: string
  type: string
  year: number
  reviewed: boolean
  completed: boolean
  options: string[]
  correctOption: string | null
  markscheme: string | null
  notes: string | null
  lastAttempted: string | null
  diagramUrl: string | null
  status: QuestionStatus
}

type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: string
}

export default function QuestionBankDashboard() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FiltersType>({
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: [],
    years: [],
    status: 'all',
  })
  const [dropdowns, setDropdowns] = useState({
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  })
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [batchUploadText, setBatchUploadText] = useState("")
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [isBatchUploadDialogOpen, setIsBatchUploadDialogOpen] = useState(false)
  const { toast } = useToast()

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/questions')
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      setQuestions(data)
      toast({
        title: "Questions Loaded",
        description: `Successfully loaded ${data.length} questions.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleStatusUpdate = useCallback(async (questionId: string, status: QuestionStatus) => {
    try {
      const response = await fetch(`/api/questions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, status }),
      })

      if (!response.ok) throw new Error('Failed to update question status')

      const updatedQuestion = await response.json()
      toast({
        title: "Status Updated",
        description: `Question status updated to ${status}.`,
      })

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.questionId === questionId ? updatedQuestion : question
        )
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update question status.",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      const filterValues = filters[tag]
      if (Array.isArray(filterValues)) {
        const isSelected = filterValues.includes(value)
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value]
        
        const newFilters = { ...filters, [tag]: updatedFilter }
        
        if (tag === 'exams') {
          const selectedExams = newFilters.exams
          newFilters.subjects = newFilters.subjects.filter(subject => 
            questions.some(q => selectedExams.includes(q.exam) && q.subject === subject)
          )
          newFilters.topics = newFilters.topics.filter(topic => 
            questions.some(q => selectedExams.includes(q.exam) && q.topic === topic)
          )
          newFilters.subtopics = newFilters.subtopics.filter(subtopic => 
            questions.some(q => selectedExams.includes(q.exam) && q.subtopic === subtopic)
          )
          newFilters.types = newFilters.types.filter(type => 
            questions.some(q => selectedExams.includes(q.exam) && q.type === type)
          )
        }
        
        setFilters(newFilters)
      }
    },
    [filters, questions]
  )

  const handleAddQuestion = async (newQuestion: Partial<Question>) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestion),
      })

      if (!response.ok) throw new Error('Failed to add question')

      const addedQuestion = await response.json()
      setQuestions((prevQuestions) => [...prevQuestions, addedQuestion])
      setIsAddQuestionOpen(false)
      toast({
        title: "Question Added",
        description: "New question has been successfully added.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditQuestion = async (editedQuestion: Question) => {
    try {
      const response = await fetch(`/api/questions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedQuestion),
      })

      if (!response.ok) throw new Error('Failed to update question')

      const updatedQuestion = await response.json()
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.questionId === editedQuestion.questionId ? updatedQuestion : q))
      )
      setIsEditDialogOpen(false)
      setEditingQuestion(null)
      toast({
        title: "Question Updated",
        description: "Question has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      })

      if (!response.ok) throw new Error('Failed to delete question')

      setQuestions((prevQuestions) => prevQuestions.filter((question) => question.questionId !== questionId))
      toast({
        title: "Question Deleted",
        description: "Question has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select questions to delete.",
        variant: "destructive",
      })
      return
    }

    try {
      const deletePromises = selectedQuestions.map(questionId =>
        fetch(`/api/questions`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionId }),
        })
      )

      const results = await Promise.allSettled(deletePromises)
      const successfulDeletes = results.filter(result => result.status === 'fulfilled').length
      const failedDeletes = results.filter(result => result.status === 'rejected').length

      setQuestions((prevQuestions) => prevQuestions.filter((question) => !selectedQuestions.includes(question.questionId)))
      setSelectedQuestions([])

      if (successfulDeletes > 0) {
        toast({
          title: "Questions Deleted",
          description: `Successfully deleted ${successfulDeletes} question${successfulDeletes > 1 ? 's' : ''}.`,
        })
      }

      if (failedDeletes > 0) {
        toast({
          title: "Deletion Partially Failed",
          description: `Failed to delete ${failedDeletes} question${failedDeletes > 1 ? 's' : ''}.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected questions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBatchUpload = async (questions: string) => {
    setIsBatchUploading(true);
    try {
      const response = await fetch('/api/questions/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.parse(questions)),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload batch of questions');
      }

      const result = await response.json();
      toast({
        title: "Batch Upload Successful",
        description: `Successfully uploaded questions.`,
      });
      fetchQuestions();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setIsBatchUploading(false);
      setIsBatchUploadDialogOpen(false);
      setBatchUploadText("");
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const lowerSearchQuery = searchQuery.toLowerCase()
      const matchesSearch =
        question.text.toLowerCase().includes(lowerSearchQuery) ||
        question.topic.toLowerCase().includes(lowerSearchQuery) ||
        (question.subtopic?.toLowerCase().includes(lowerSearchQuery) ?? false) ||
        question.subject.toLowerCase().includes(lowerSearchQuery)

      const matchesFilters =
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || (question.subtopic && filters.subtopics.includes(question.subtopic))) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year.toString())) &&
        (!filters.types.length || filters.types.includes(question.type)) &&
        (filters.status === 'all' || question.status === filters.status)

      return matchesSearch && matchesFilters
    })
  }, [questions, filters, searchQuery])

  const totalQuestions = questions.length
  const draftQuestions = useMemo(() => questions.filter((question) => question.status === 'DRAFT').length, [questions])
  const activeQuestions = useMemo(() => questions.filter((question) => question.status === 'ACTIVE').length, [questions])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Question Bank Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span>Total Questions</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions}</div>
              <p className="text-xs text-muted-foreground">+20% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                  <span>Draft Questions</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftQuestions}</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Active Questions</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeQuestions}</div>
              <p className="text-xs text-muted-foreground">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Avg. Creation Time</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 days</div>
              <p className="text-xs text-muted-foreground">-10% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <Select defaultValue="all" onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as QuestionStatus }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questions</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <ScrollArea className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                <QuestionForm onSubmit={handleAddQuestion} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Dialog open={isBatchUploadDialogOpen} onOpenChange={setIsBatchUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Batch Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Batch Upload Questions</DialogTitle>
                <DialogDescription>
                  Upload questions via JSON format.
                </DialogDescription>
              </DialogHeader>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="batchText">Paste Questions JSON</Label>
                <Textarea 
                  id="batchText"
                  placeholder="Paste your questions JSON here..."
                  value={batchUploadText}
                  onChange={(e) => setBatchUploadText(e.target.value)}
                  rows={10}
                  disabled={isBatchUploading}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={() => handleBatchUpload(batchUploadText)} 
                  disabled={isBatchUploading}
                >
                  {isBatchUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="destructive" 
            onClick={handleDeleteSelected}
            disabled={selectedQuestions.length === 0}
          >
            Delete Selected
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          {[
            "exams",
            "subjects",
            "topics",
            "subtopics",
            "difficulties",
            "years",
            "types",
          ].map((filterType) => (
            <Tooltip key={filterType}>
              <TooltipTrigger asChild>
                <Popover
                  content={
                    <div className="w-full bg-white rounded-md p-2 sm:w-80">
                      <Input
                        type="text"
                        placeholder={`Search ${filterType}...`}
                        className="mb-2"
                        onChange={(e) => {
                          // Implement search functionality here
                        }}
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {Array.from(
                          new Set(
                            questions
                              .filter(q => 
                                filters.exams.length === 0 || filters.exams.includes(q.exam)
                              )
                              .map((q) => {
                                switch (filterType) {
                                  case "exams":
                                    return q.exam
                                  case "subjects":
                                    return q.subject
                                  case "topics":
                                    return q.topic
                                  case "subtopics":
                                    return q.subtopic ?? ''
                                  case "difficulties":
                                    return q.difficulty
                                  case "years":
                                    return q.year.toString()
                                  case "types":
                                    return q.type
                                  default:
                                    return ""
                                }
                              })
                          )
                        ).map((value) => (
                          <div key={value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`${filterType}-${value}`}
                              className="mr-2"
                              checked={
                                (filters[filterType as keyof FiltersType] as string[] || []).includes(value)
                              }
                              onChange={() =>
                                handleFilterChange(filterType as keyof FiltersType, value)
                              }
                            />
                            <label
                              htmlFor={`${filterType}-${value}`}
                              className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                            >
                              {value || ''}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
                  align="start"
                  openPopover={dropdowns[filterType as keyof typeof dropdowns]}
                  setOpenPopover={(open) => {
                    setDropdowns(prev => ({ ...prev, [filterType]: open }))
                  }}
                >
                  <button
                    onClick={() => setDropdowns(prev => ({ ...prev, [filterType]: !prev[filterType as keyof typeof dropdowns] }))}
                    className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 bg-white transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
                  >
                    <p className="text-gray-600">
                      {Array.isArray(filters[filterType as keyof FiltersType]) &&
                      (filters[filterType as keyof FiltersType] as string[]).length
                        ? `${
                            (filters[filterType as keyof FiltersType] as string[])
                              .length
                          } selected`
                        : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </p>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-all ${
                        dropdowns[filterType as keyof typeof dropdowns]
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                Select {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedQuestions.length === filteredQuestions.length}
                      onCheckedChange={(checked) => {
                        setSelectedQuestions(
                          checked
                            ? filteredQuestions.map((q) => q.questionId)
                            : []
                        )
                      }}
                    />
                  </TableHead>
                  <TableHead>Question ID</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question) => (
                  <TableRow key={question.questionId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedQuestions.includes(question.questionId)}
                        onCheckedChange={(checked) => {
                          setSelectedQuestions(
                            checked
                              ? [...selectedQuestions, question.questionId]
                              : selectedQuestions.filter((id) => id !== question.questionId)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{question.questionId}</TableCell>
                    <TableCell>{question.text.substring(0, 50)}...</TableCell>
                    <TableCell>{question.subject}</TableCell>
                    <TableCell>{question.topic}</TableCell>
                    <TableCell>{question.difficulty}</TableCell>
                    <TableCell>{question.correctOption}</TableCell>
                    <TableCell>{question.status}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditingQuestion(question)
                            setIsEditDialogOpen(true)
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteQuestion(question.questionId)}>
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <ScrollArea className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            {editingQuestion && (
              <QuestionForm
                initialData={editingQuestion}
                onSubmit={(updatedQuestion) => handleEditQuestion({ ...editingQuestion, ...updatedQuestion })}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

interface QuestionFormProps {
  initialData?: Partial<Question>
  onSubmit: (question: Partial<Question>) => void
}

function QuestionForm({ initialData, onSubmit }: QuestionFormProps) {
  const [formData, setFormData] = useState<Partial<Question>>(initialData || {})
  const [options, setOptions] = useState<string[]>(initialData?.options || [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const handleAddOption = () => {
    setOptions(prev => [...prev, ''])
    setFormData(prev => ({ ...prev, options: [...(prev.options || []), ''] }))
  }

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== index) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, options })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Question Text</Label>
        <Textarea
          id="text"
          name="text"
          value={formData.text || ''}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject || ''}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            name="topic"
            value={formData.topic || ''}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select name="difficulty" value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveOption(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddOption}>
          Add Option
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="correctOption">Correct Option</Label>
        <Select name="correctOption" value={formData.correctOption || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, correctOption: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select correct option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="markscheme">Mark Scheme</Label>
        <Textarea
          id="markscheme"
          name="markscheme"
          value={formData.markscheme || ''}
          onChange={handleInputChange}
        />
      </div>
      <Button type="submit">
        {initialData ? 'Update Question' : 'Add Question'}
      </Button>
    </form>
  )
}
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Popover from "@/components/shared/popover"
import { ArrowUpIcon, ArrowDownIcon, ChevronDown, Search, List, Plus, Trash2, Edit, Eye, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react'

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'UNDER_REVIEW'

interface Question {
  id: string
  text: string
  exam: string
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  type: string
  year: string
  status: Status
  createdAt: string
  updatedAt: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
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

export default function EnhancedQuestionBankDashboard() {
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
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>("")
  const { toast } = useToast()

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('/api/questions')
      if (!response.ok) throw new Error('Failed to fetch questions')
      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleStatusUpdate = useCallback(async (id: string, status: Status) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update question status')

      toast({
        title: "Success",
        description: `Question status updated to ${status}.`,
      })

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.id === id ? { ...question, status } : question
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
        title: "Success",
        description: "Question added successfully.",
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
      const response = await fetch(`/api/questions/${editedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedQuestion),
      })

      if (!response.ok) throw new Error('Failed to update question')

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === editedQuestion.id ? editedQuestion : q))
      )
      setIsEditDialogOpen(false)
      setEditingQuestion(null)
      toast({
        title: "Success",
        description: "Question updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete question')

      setQuestions((prevQuestions) => prevQuestions.filter((question) => question.id !== id))
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedQuestions.length === 0) return

    try {
      const response = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: bulkAction, questionIds: selectedQuestions }),
      })

      if (!response.ok) throw new Error('Failed to perform bulk action')

      fetchQuestions()
      setSelectedQuestions([])
      setBulkAction("")
      toast({
        title: "Success",
        description: `Bulk action '${bulkAction}' performed successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const lowerSearchQuery = searchQuery.toLowerCase()
      const matchesSearch =
        question.text.toLowerCase().includes(lowerSearchQuery) ||
        question.topic.toLowerCase().includes(lowerSearchQuery) ||
        question.subtopic.toLowerCase().includes(lowerSearchQuery) ||
        question.subject.toLowerCase().includes(lowerSearchQuery)

      const matchesFilters =
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type))

      return matchesSearch && matchesFilters
    })
  }, [questions, filters, searchQuery])

  const totalQuestions = questions.length
  const draftQuestions = useMemo(() => questions.filter((question) => question.status === 'DRAFT').length, [questions])
  const publishedQuestions = useMemo(() => questions.filter((question) => question.status === 'PUBLISHED').length, [questions])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Enhanced Question Bank Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions}</div>
              <p className="text-xs text-muted-foreground">+20% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Questions</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftQuestions}</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Questions</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedQuestions}</div>
              <p className="text-xs text-muted-foreground">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Creation Time</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 days</div>
              <p className="text-xs text-muted-foreground">-10% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <Select defaultValue="all" onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questions</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
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
          <Dialog open={isNavigatorOpen} onOpenChange={setIsNavigatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <List className="mr-2 h-4 w-4" />
                Question Navigator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Question Navigator</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                  {filteredQuestions.map((question, index) => (
                    <Tooltip key={question.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={question.status === 'PUBLISHED' ? "default" : "outline"}
                          size="sm"
                          className={`w-10 h-10 ${
                            question.status === 'PUBLISHED'
                              ? "bg-green-100 border-green-500 text-green-700"
                              : question.status === 'UNDER_REVIEW'
                              ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                              : ""
                          }`}
                        >
                          {index + 1}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{question.text.substring(0, 50)}...</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
              </DialogHeader>
              <QuestionForm onSubmit={handleAddQuestion} />
            </DialogContent>
          </Dialog>
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
                                    return q.subtopic
                                  case "difficulties":
                                    return q.difficulty
                                  case "years":
                                    return q.year
                                  case "types":
                                    return q.type
                                  default:
                                    return ""
                                }
                              })
                          )
                        ).map((value: string) => (
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
                              {value}
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

        <div className="flex items-center space-x-2 mb-4">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bulk actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">Publish</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleBulkAction} disabled={!bulkAction || selectedQuestions.length === 0}>
            Apply
          </Button>
        </div>

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
                          ? filteredQuestions.map((q) => q.id)
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => {
                        setSelectedQuestions(
                          checked
                            ? [...selectedQuestions, question.id]
                            : selectedQuestions.filter((id) => id !== question.id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell>{question.id}</TableCell>
                  <TableCell>{question.text.substring(0, 50)}...</TableCell>
                  <TableCell>{question.subject}</TableCell>
                  <TableCell>{question.topic}</TableCell>
                  <TableCell>{question.difficulty}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={question.status}
                      onValueChange={(value) => handleStatusUpdate(question.id, value as Status)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleDeleteQuestion(question.id)}>
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
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm
              initialData={editingQuestion}
              onSubmit={(updatedQuestion) => handleEditQuestion({ ...editingQuestion, ...updatedQuestion })}
            />
          )}
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
  const [showPreview, setShowPreview] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="text">Question Text</Label>
        <Textarea
          id="text"
          name="text"
          value={formData.text || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="exam">Exam</Label>
          <Input
            id="exam"
            name="exam"
            value={formData.exam || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            name="topic"
            value={formData.topic || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="subtopic">Subtopic</Label>
          <Input
            id="subtopic"
            name="subtopic"
            value={formData.subtopic || ''}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" value={formData.difficulty} onValueChange={(value) => handleChange({ target: { name: 'difficulty', value } } as any)}>
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
        <div>
          <Label htmlFor="type">Type</Label>
          <Select name="type" value={formData.type} onValueChange={(value) => handleChange({ target: { name: 'type', value } } as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
              <SelectItem value="True/False">True/False</SelectItem>
              <SelectItem value="Short Answer">Short Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            value={formData.year || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      {formData.type === 'Multiple Choice' && (
        <div>
          <Label>Options</Label>
          {(formData.options || []).map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...(formData.options || [])]
                  newOptions[index] = e.target.value
                  setFormData((prev) => ({ ...prev, options: newOptions }))
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const newOptions = (formData.options || []).filter((_, i) => i !== index)
                  setFormData((prev) => ({ ...prev, options: newOptions }))
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData((prev) => ({ ...prev, options: [...(prev.options || []), ''] }))}
            className="mt-2"
          >
            Add Option
          </Button>
        </div>
      )}
      <div>
        <Label htmlFor="correctAnswer">Correct Answer</Label>
        <Input
          id="correctAnswer"
          name="correctAnswer"
          value={formData.correctAnswer || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          value={formData.explanation || ''}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button type="submit">Save Question</Button>
      </div>
      {showPreview && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>
          <QuestionPreview question={formData as Question} />
        </div>
      )}
    </form>
  )
}

interface QuestionPreviewProps {
  question: Question
}

function QuestionPreview({ question }: QuestionPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
        {question.type === 'Multiple Choice' && (
          <RadioGroup>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {question.type === 'True/False' && (
          <RadioGroup>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false">False</Label>
            </div>
          </RadioGroup>
        )}
        {question.type === 'Short Answer' && (
          <Textarea placeholder="Enter your answer here" className="mt-2" />
        )}
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Question Details:</h3>
        <p><strong>Exam:</strong> {question.exam}</p>
        <p><strong>Subject:</strong> {question.subject}</p>
        <p><strong>Topic:</strong> {question.topic}</p>
        <p><strong>Subtopic:</strong> {question.subtopic}</p>
        <p><strong>Difficulty:</strong> {question.difficulty}</p>
        <p><strong>Type:</strong> {question.type}</p>
        <p><strong>Year:</strong> {question.year}</p>
        <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
        {question.explanation && (
          <>
            <h4 className="font-semibold mt-2">Explanation:</h4>
            <p>{question.explanation}</p>
          </>
        )}
      </div>
    </div>
  )
}
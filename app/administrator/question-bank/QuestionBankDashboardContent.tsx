'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpIcon, ArrowDownIcon, ChevronDown, Search, Plus, Trash2, Edit, Eye, CheckCircle, XCircle, MoreHorizontal, Upload, FileUp, FileJson, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useQuestionContext } from './QuestionContext'
import type { Question, QuestionStatus } from './types'

// Types
type FiltersType = {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  types: string[];
  years: string[];
  status: QuestionStatus | 'all';
}

// Constants
const PAGE_SIZE = 20

// API functions
const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const response = await fetch('/api/questions')
    if (!response.ok) throw new Error('Failed to fetch questions')
    return response.json()
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

const updateQuestion = async (question: Partial<Question>): Promise<Question> => {
  try {
    const response = await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    })
    if (!response.ok) throw new Error('Failed to update question')
    return response.json()
  } catch (error) {
    console.error('Error updating question:', error)
    throw error
  }
}

// Components
const QuestionForm = ({ initialData, onSubmit }: { initialData?: Partial<Question>, onSubmit: (question: Partial<Question>) => void }) => {
  const [formData, setFormData] = useState<Partial<Question>>(() => ({
    text: '',
    subject: '',
    topic: '',
    difficulty: '',
    options: [],
    correctOption: '',
    markscheme: '',
    notes: [],
    ...initialData
  }))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newOptions = [...(prev.options || [])]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }))
  }

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }))
  }

  const handleNoteChange = (index: number, value: string) => {
    setFormData(prev => {
      const newNotes = [...(prev.notes || [])]
      newNotes[index] = { ...newNotes[index], content: value }
      return { ...prev, notes: newNotes }
    })
  }

  const handleAddNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), { id: Date.now().toString(), content: '' }]
    }))
  }

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Question Text</Label>
        <Textarea
          id="text"
          name="text"
          value={formData.text}
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
            value={formData.subject}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          name="difficulty"
          value={formData.difficulty}
          onValueChange={(value) => handleSelectChange('difficulty', value)}
        >
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
        {formData.options?.map((option, index) => (
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
        <Select
          name="correctOption"
          value={formData.correctOption || ''}
          onValueChange={(value) => handleSelectChange('correctOption', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select correct option" />
          </SelectTrigger>
          <SelectContent>
            {formData.options?.map((option, index) => (
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
      <div className="space-y-2">
        <Label>Notes</Label>
        {formData.notes?.map((note, index) => (
          <div key={note.id} className="flex items-center space-x-2">
            <Textarea
              value={note.content}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              placeholder={`Note ${index + 1}`}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveNote(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddNote}>
          Add Note
        </Button>
      </div>
      <DialogFooter>
        <Button type="submit">Save Question</Button>
      </DialogFooter>
    </form>
  )
}

const FilterButton = ({ filterType }: { filterType: keyof FiltersType }) => {
  const { filters, setFilters, questions } = useQuestionContext()

  const handleFilterChange = useCallback(
    (value: string) => {
      setFilters(prevFilters => {
        const filterValues = prevFilters[filterType]
        if (Array.isArray(filterValues)) {
          const isSelected = filterValues.includes(value)
          const updatedFilter = isSelected
            ? filterValues.filter((v: string) => v !== value)
            : [...filterValues, value]

          const newFilters = { ...prevFilters, [filterType]: updatedFilter }

          // Update related filters
          if (filterType === 'exams') {
            const selectedExams = newFilters.exams
            newFilters.subjects = newFilters.subjects.filter(subject =>
              questions?.some(q => selectedExams.includes(q.exam) && q.subject === subject)
            )
            // ... (update other related filters)
          }

          return newFilters
        }
        return prevFilters
      })
    },
    [filterType, questions, setFilters]
  )

  const filterValues = useMemo(() => {
    if (!questions) return []
    return Array.from(
      new Set(
        questions.map((q) => {
          switch (filterType) {
            case "exams": return q.exam
            case "subjects": return q.subject
            case "topics": return q.topic
            case "subtopics": return q.subtopic ?? ''
            case "difficulties": return q.difficulty
            case "years": return q.year?.toString() ?? ''
            case "types": return q.type
            default: return ""
          }
        })
      )
    )
  }, [questions, filterType])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-36">
              <span className="mr-2 truncate">
                {filters[filterType].length
                  ? `${filters[filterType].length} selected`
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[200px]">
            <ScrollArea className="h-[300px]">
              {filterValues.map((value) => (
                <div key={value} className="flex items-center space-x-2 p-2">
                  <Checkbox
                    id={`${filterType}-${value}`}
                    checked={filters[filterType].includes(value)}
                    onCheckedChange={() => handleFilterChange(value)}
                  />
                  <label
                    htmlFor={`${filterType}-${value}`}
                    className="text-sm cursor-pointer"
                  >
                    {value}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </TooltipTrigger>
      <TooltipContent>
        Select {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
      </TooltipContent>
    </Tooltip>
  )
}

export function QuestionBankDashboardContent() {
  const { questions, setQuestions, filters, setFilters, searchQuery, setSearchQuery } = useQuestionContext()
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [isBatchUploadDialogOpen, setIsBatchUploadDialogOpen] = useState(false)
  const [batchUploadText, setBatchUploadText] = useState("")
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  const { data: fetchedQuestions = [], isLoading, error } = useQuery<Question[], Error>({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
  })

  const updateQuestionMutation = useMutation({
    mutationFn: updateQuestion,
    onMutate: async (updatedQuestion) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] })
      const previousQuestions = queryClient.getQueryData<Question[]>(['questions'])
      queryClient.setQueryData<Question[]>(['questions'], (old) =>
        old?.map(question =>
          question.questionId === updatedQuestion.questionId ? { ...question, ...updatedQuestion } : question
        ) ?? []
      )
      return { previousQuestions }
    },
    onError: (err, newQuestion, context: any) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(['questions'], context.previousQuestions)
      }
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const filteredQuestions = useMemo(() => {
    return fetchedQuestions.filter((question) => {
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
    }).sort((a, b) => parseInt(a.questionId) - parseInt(b.questionId))
  }, [fetchedQuestions, filters, searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredQuestions.slice(startIndex, endIndex)
  }, [filteredQuestions, currentPage])

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: paginatedQuestions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [setSearchQuery])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })

      if (!response.ok) throw new Error('Failed to delete question')

      queryClient.setQueryData<Question[]>(['questions'], (oldQuestions) => 
        oldQuestions?.filter((q) => q.questionId !== questionId) ?? []
      )

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
  }, [queryClient, toast])

  const handleDeleteSelected = useCallback(async () => {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId }),
        })
      )

      const results = await Promise.allSettled(deletePromises)
      const successfulDeletes = results.filter(result => result.status === 'fulfilled').length
      const failedDeletes = results.filter(result => result.status === 'rejected').length

      queryClient.setQueryData<Question[]>(['questions'], (oldQuestions) => 
        oldQuestions?.filter((q) => !selectedQuestions.includes(q.questionId)) ?? []
      )

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
  }, [selectedQuestions, queryClient, toast])

  const handleBatchUpload = useCallback(async (questions: string) => {
    try {
      const response = await fetch('/api/questions/batch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: questions,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload batch of questions');
      }

      const result = await response.json();
      queryClient.setQueryData<Question[]>(['questions'], (oldQuestions) => 
        [...(oldQuestions ?? []), ...result]
      )
      toast({
        title: "Batch Upload Successful",
        description: `Successfully uploaded ${result.length} questions.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload questions",
        variant: "destructive",
      });
    } finally {
      setIsBatchUploadDialogOpen(false);
      setBatchUploadText("");
    }
  }, [queryClient, toast]);

  const handleAddQuestion = useCallback(async (newQuestion: Partial<Question>) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      })

      if (!response.ok) throw new Error('Failed to add question')

      const addedQuestion = await response.json()
      queryClient.setQueryData<Question[]>(['questions'], (oldQuestions) => 
        [...(oldQuestions ?? []), addedQuestion]
      )
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
  }, [queryClient, toast])

  const handleEditQuestion = useCallback(async (editedQuestion: Partial<Question>) => {
    try {
      await updateQuestionMutation.mutateAsync(editedQuestion)
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
  }, [updateQuestionMutation, toast])

  if (error) {
    return <div>Error loading questions. Please try again later.</div>
  }

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
              <div className="text-2xl font-bold">{fetchedQuestions.length}</div>
              <p className="text-xs text-muted-foreground">+20% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as QuestionStatus | 'all' }))}
          >
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
              onChange={(e) => handleSearchChange(e.target.value)}
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
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={() => handleBatchUpload(batchUploadText)}
                >
                  Upload
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
            <FilterButton key={filterType} filterType={filterType as keyof FiltersType} />
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
            <div ref={parentRef} style={{ height: `500px`, overflow: 'auto' }}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedQuestions.length === paginatedQuestions.length}
                          onCheckedChange={(checked) => {
                            setSelectedQuestions(
                              checked
                                ? paginatedQuestions.map((q) => q.questionId)
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
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const question = paginatedQuestions[virtualRow.index]
                      return (
                        <TableRow
                          key={question.questionId}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                        >
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
                                <DropdownMenuItem onClick={() => setEditingQuestion(question)}>
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
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {editingQuestion && (
        <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <DialogContent className="sm:max-w-[625px]">
            <ScrollArea className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
              </DialogHeader>
              <QuestionForm initialData={editingQuestion} onSubmit={handleEditQuestion} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  )
}

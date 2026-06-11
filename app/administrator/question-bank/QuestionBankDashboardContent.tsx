"use client"

import type React from "react"
import Link from "next/link"
import { useState, useCallback, useMemo, createContext, useContext } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, Upload, Trash2, Edit, CheckCircle2, Archive } from "lucide-react"
import debounce from "lodash/debounce"
import type { Question, QuestionStatus } from "./types"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Types
type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: QuestionStatus | "all"
}

// Custom Hooks
function useQuestions(filters: FiltersType, searchQuery: string) {
  const fetchQuestions = async (): Promise<Question[]> => {
    // Admin view: request every status (incl. DRAFT/ARCHIVED). The API returns
    // a paginated { data, totalCount } envelope, so unwrap .data.
    const response = await fetch("/api/questions?status=all&pageSize=200")
    if (!response.ok) throw new Error("Failed to fetch questions")
    const json = await response.json()
    return Array.isArray(json) ? json : json.data ?? []
  }

  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  })

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => {
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
          (filters.status === "all" || question.status === filters.status)

        return matchesSearch && matchesFilters
      })
      .sort((a, b) => Number.parseInt(a.questionId) - Number.parseInt(b.questionId))
  }, [questions, filters, searchQuery])

  const statusCounts = useMemo(() => {
    const counts = { ACTIVE: 0, DRAFT: 0, ARCHIVED: 0 } as Record<string, number>
    for (const q of questions) counts[q.status] = (counts[q.status] ?? 0) + 1
    return counts
  }, [questions])

  return { questions: filteredQuestions, isLoading, error, statusCounts, totalCount: questions.length }
}

// Contexts
const FiltersContext = createContext<{
  filters: FiltersType
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>
} | null>(null)

const SelectedQuestionsContext = createContext<{
  selectedQuestions: Set<string>
  toggleQuestionSelection: (questionId: string) => void
  clearSelection: () => void
} | null>(null)

const QuestionsContext = createContext<{
  questions: Question[]
  isLoading: boolean
} | null>(null)

// Filters Component
function Filters() {
  const { filters, setFilters } = useContext(FiltersContext)!
  const { questions } = useContext(QuestionsContext)!

  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      setFilters((prevFilters) => {
        const filterValues = prevFilters[tag]
        if (Array.isArray(filterValues)) {
          const isSelected = filterValues.includes(value)
          const updatedFilter = isSelected ? filterValues.filter((v) => v !== value) : [...filterValues, value]
          return { ...prevFilters, [tag]: updatedFilter }
        }
        return prevFilters
      })
    },
    [setFilters],
  )

  const filterCategories = [
    { key: "exams", label: "Exams" },
    { key: "subjects", label: "Subjects" },
    { key: "topics", label: "Topics" },
    { key: "subtopics", label: "Subtopics" },
    { key: "difficulties", label: "Difficulties" },
    { key: "types", label: "Types" },
    { key: "years", label: "Years" },
  ] as const

  return (
    <div className="w-64 p-4 bg-background border-r">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <Separator className="my-4" />
      {filterCategories.map((category) => {
        const values = Array.from(
          new Set(
            questions.map((q) => {
              switch (category.key) {
                case "exams":
                  return q.exam
                case "subjects":
                  return q.subject
                case "topics":
                  return q.topic
                case "subtopics":
                  return q.subtopic ?? ""
                case "difficulties":
                  return q.difficulty
                case "types":
                  return q.type
                case "years":
                  return q.year?.toString() ?? ""
                default:
                  return ""
              }
            }),
          ),
        ).filter((v) => v !== "")

        return (
          <div key={category.key} className="mb-6">
            <Label className="font-medium mb-2 block">{category.label}</Label>
            <div className="space-y-2">
              {values.map((value) => (
                <div key={value} className="flex items-center">
                  <Checkbox
                    id={`${category.key}-${value}`}
                    checked={filters[category.key as keyof FiltersType].includes(value)}
                    onCheckedChange={() => handleFilterChange(category.key as keyof FiltersType, value)}
                    className="mr-2"
                  />
                  <Label htmlFor={`${category.key}-${value}`} className="text-sm cursor-pointer">
                    {value}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// QuestionForm Component
function QuestionForm({
  initialData,
  onSubmit,
}: {
  initialData?: Partial<Question>
  onSubmit: (question: Partial<Question>) => void
}) {
  const [formData, setFormData] = useState<Partial<Question>>(() => ({
    text: "",
    subject: "",
    topic: "",
    difficulty: "",
    options: [],
    correctOption: "",
    markscheme: "",
    notes: [],
    ...initialData,
  }))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || [])]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }))
  }

  const handleRemoveOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
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
        <Textarea id="text" name="text" value={formData.text} onChange={handleInputChange} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" name="topic" value={formData.topic} onChange={handleInputChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          name="difficulty"
          value={formData.difficulty || ""}
          onValueChange={(value) => handleSelectChange("difficulty", value)}
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
          value={formData.correctOption || ""}
          onValueChange={(value) => handleSelectChange("correctOption", value)}
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
        <Textarea id="markscheme" name="markscheme" value={formData.markscheme || ""} onChange={handleInputChange} />
      </div>
      <DialogFooter>
        <Button type="submit">Save Question</Button>
      </DialogFooter>
    </form>
  )
}

// QuestionTable Component
function QuestionTable({
  currentPage,
  pageSize,
  onEdit,
  onDelete,
  onSetStatus,
}: {
  currentPage: number
  pageSize: number
  onEdit: (question: Question) => void
  onDelete: (questionId: string) => void
  onSetStatus: (questionId: string, status: QuestionStatus) => void
}) {
  const { questions, isLoading } = useContext(QuestionsContext)!
  const { selectedQuestions, toggleQuestionSelection } = useContext(SelectedQuestionsContext)!
  const startIndex = (currentPage - 1) * pageSize
  const paginatedQuestions = questions.slice(startIndex, startIndex + pageSize)

  if (isLoading) {
    return (
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
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedQuestions.size === paginatedQuestions.length}
                onCheckedChange={(checked) => {
                  paginatedQuestions.forEach((q) => {
                    if (checked) {
                      selectedQuestions.add(q.questionId)
                    } else {
                      selectedQuestions.delete(q.questionId)
                    }
                  })
                }}
              />
            </TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedQuestions.map((question) => (
            <TableRow key={question.questionId}>
              <TableCell>
                <Checkbox
                  checked={selectedQuestions.has(question.questionId)}
                  onCheckedChange={() => toggleQuestionSelection(question.questionId)}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">{question.text.substring(0, 50)}...</div>
                <div className="text-sm text-muted-foreground">ID: {question.questionId}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{question.subject}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{question.difficulty}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    question.status === "ACTIVE"
                      ? "default"
                      : question.status === "DRAFT"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {question.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                {question.status !== "ACTIVE" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Activate (publish to question bank)"
                    onClick={() => onSetStatus(question.questionId, "ACTIVE")}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Archive (hide from question bank)"
                    onClick={() => onSetStatus(question.questionId, "ARCHIVED")}
                  >
                    <Archive className="h-4 w-4 text-amber-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(question.questionId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex justify-center mt-4">
      <Button variant="outline" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        Previous
      </Button>
      <span className="mx-4">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}

// Main Component
export function QuestionBankDashboardContent() {
  const [filters, setFilters] = useState<FiltersType>({
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: [],
    years: [],
    status: "all",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const pageSize = 20
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
      }, 300),
    [],
  )

  const { questions, isLoading, error, statusCounts, totalCount } = useQuestions(filters, searchQuery)

  const totalPages = Math.ceil(questions.length / pageSize)

  // Mutations for add, edit, delete operations
  const addQuestionMutation = useMutation({
    mutationFn: async (newQuestion: Partial<Question>) => {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add question")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
      toast({
        title: "Question Added",
        description: "New question has been successfully added.",
      })
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add question.",
        variant: "destructive",
      })
    },
  })

  const editQuestionMutation = useMutation({
    mutationFn: async (updatedQuestion: Partial<Question>) => {
      const response = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQuestion),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update question")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
      toast({
        title: "Question Updated",
        description: "Question has been successfully updated.",
      })
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update question.",
        variant: "destructive",
      })
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/questions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      })
      if (!response.ok) throw new Error("Failed to delete question")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
      toast({
        title: "Question Deleted",
        description: "Question has been successfully deleted.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleAddQuestion = async (newQuestion: Partial<Question>) => {
    await addQuestionMutation.mutateAsync(newQuestion)
    setIsAddQuestionOpen(false)
  }

  const handleEditQuestion = async (editedQuestion: Partial<Question>) => {
    await editQuestionMutation.mutateAsync(editedQuestion)
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    await deleteQuestionMutation.mutateAsync(questionId)
  }

  const handleSetStatus = async (questionId: string, status: QuestionStatus) => {
    await editQuestionMutation.mutateAsync({ questionId, status })
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(questionId)) {
        newSelected.delete(questionId)
      } else {
        newSelected.add(questionId)
      }
      return newSelected
    })
  }

  const clearSelection = () => {
    setSelectedQuestions(new Set())
  }

  if (error) {
    return <div>Error loading questions. Please try again later.</div>
  }

  return (
    <TooltipProvider>
      <FiltersContext.Provider value={{ filters, setFilters }}>
        <SelectedQuestionsContext.Provider value={{ selectedQuestions, toggleQuestionSelection, clearSelection }}>
          <QuestionsContext.Provider value={{ questions, isLoading }}>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar Filters */}
              <Filters />

              {/* Main Content */}
              <div className="flex-1 overflow-auto">
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
                    <div className="flex items-center space-x-4">
                      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                          <DialogHeader>
                            <DialogTitle>Add New Question</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[80vh] overflow-y-auto">
                            <QuestionForm onSubmit={handleAddQuestion} />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" asChild>
                        <Link href="/administrator/question-bank/import">
                          <Upload className="mr-2 h-4 w-4" />
                          Import from PDF
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={statusCounts.DRAFT > 0 ? "border-amber-300" : undefined}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drafts to review</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.DRAFT ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.ACTIVE ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Archived</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.ARCHIVED ?? 0}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search + status filter */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search questions..."
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => {
                        setFilters((prev) => ({ ...prev, status: value as QuestionStatus | "all" }))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft (needs review)</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Questions Table */}
                  <QuestionTable
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onEdit={(question) => setEditingQuestion(question)}
                    onDelete={handleDeleteQuestion}
                    onSetStatus={handleSetStatus}
                  />

                  {/* Pagination */}
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </div>

              {/* Edit Question Dialog */}
              {editingQuestion && (
                <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[80vh] overflow-y-auto">
                      <QuestionForm initialData={editingQuestion} onSubmit={handleEditQuestion} />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </QuestionsContext.Provider>
        </SelectedQuestionsContext.Provider>
      </FiltersContext.Provider>
    </TooltipProvider>
  )
}


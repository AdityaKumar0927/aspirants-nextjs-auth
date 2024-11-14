"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import {
  ChevronDown,
  Search,
  Edit,
  Trash2,
  Eye,
  Plus,
  Filter,
  MoreHorizontal,
  PlusCircle,
  File,
  Upload,
  Loader,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import MathRenderer from "@/components/layout/MathRenderer"

type QuestionStatus = "ACTIVE" | "DRAFT" | "ARCHIVED" | "UNDER_REVIEW"

interface Question {
  questionId: string
  text: string
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  type: "Multiple Choice" | "Numerical"
  exam: string
  year: string
  status: QuestionStatus
  options?: string[]
  reviewed: boolean
}

interface FiltersType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: QuestionStatus | "ALL"
}

const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  types: [],
  years: [],
  status: "ALL",
}

export default function QuestionBankDashboard() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filters, setFilters] = useState<FiltersType>(initialFilters)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [jsonInput, setJsonInput] = useState<string>("")
  const [batchUpload, setBatchUpload] = useState<Question[]>([])

  useEffect(() => {
    if (status === "authenticated") {
      fetchQuestions()
    }
  }, [status])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data: Question[] = await response.json()
      setQuestions(data)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.subtopic.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilters =
        (filters.exams.length === 0 || filters.exams.includes(question.exam)) &&
        (filters.subjects.length === 0 || filters.subjects.includes(question.subject)) &&
        (filters.topics.length === 0 || filters.topics.includes(question.topic)) &&
        (filters.subtopics.length === 0 || filters.subtopics.includes(question.subtopic)) &&
        (filters.difficulties.length === 0 || filters.difficulties.includes(question.difficulty)) &&
        (filters.types.length === 0 || filters.types.includes(question.type)) &&
        (filters.years.length === 0 || filters.years.includes(question.year)) &&
        (filters.status === "ALL" || filters.status === question.status)

      return matchesSearch && matchesFilters
    })
  }, [questions, searchQuery, filters])

  const handleFilterChange = (filterType: keyof FiltersType, value: string) => {
    setFilters((prevFilters) => {
      const updatedFilter = prevFilters[filterType] as string[]
      const newFilter = updatedFilter.includes(value)
        ? updatedFilter.filter((item) => item !== value)
        : [...updatedFilter, value]
      return { ...prevFilters, [filterType]: newFilter }
    })
  }

  const handleStatusChange = async (questionId: string, newStatus: QuestionStatus) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/questions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId, status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update question status")

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, status: newStatus } : q
        )
      )
      toast({
        title: "Status Updated",
        description: `Question ${questionId} status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating question status:", error)
      toast({
        title: "Error",
        description: "Failed to update question status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/questions`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId }),
      })

      if (!response.ok) throw new Error("Failed to delete question")

      setQuestions((prevQuestions) => prevQuestions.filter((q) => q.questionId !== questionId))
      toast({
        title: "Question Deleted",
        description: `Question ${questionId} has been deleted`,
      })
    } catch (error) {
      console.error("Error deleting question:", error)
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select questions to delete.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/questions/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionIds: selectedQuestions }),
      })

      if (!response.ok) throw new Error("Failed to delete questions")

      setQuestions((prevQuestions) =>
        prevQuestions.filter((q) => !selectedQuestions.includes(q.questionId))
      )
      setSelectedQuestions([])
      toast({
        title: "Questions Deleted",
        description: `${selectedQuestions.length} questions have been deleted`,
      })
    } catch (error) {
      console.error("Error deleting questions:", error)
      toast({
        title: "Error",
        description: "Failed to delete questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
  }

  const handleSaveEdit = async (updatedQuestion: Question) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/questions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedQuestion),
      })

      if (!response.ok) throw new Error("Failed to update question")

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === updatedQuestion.questionId ? updatedQuestion : q
        )
      )
      setEditingQuestion(null)
      toast({
        title: "Question Updated",
        description: `Question ${updatedQuestion.questionId} has been updated`,
      })
    } catch (error) {
      console.error("Error updating question:", error)
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value
    setJsonInput(input)
    try {
      const parsedQuestions: Question[] = JSON.parse(input)
      setBatchUpload(parsedQuestions)
    } catch (error) {
      setBatchUpload([])
      console.error("Invalid JSON input:", error)
    }
  }

  const handleBatchUpload = async () => {
    if (batchUpload.length === 0) {
      toast({
        title: "No Questions to Upload",
        description: "Please provide valid JSON data for questions.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/questions/batch-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchUpload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload batch of questions")
      }

      const result = await response.json()
      setQuestions((prev) => [...prev, ...batchUpload])
      setJsonInput("")
      setBatchUpload([])
      toast({
        title: "Batch Upload Successful",
        description: `${batchUpload.length} questions have been uploaded`,
      })
    } catch (error) {
      console.error("Error uploading batch:", error)
      toast({
        title: "Error",
        description: "Failed to upload questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const FilterPopover = ({ filterType, options }: { filterType: keyof FiltersType; options: string[] }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-8 border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          {filterType}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <ScrollArea className="h-80">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">{filterType}</h4>
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filterType}-${option}`}
                  checked={filters[filterType].includes(option)}
                  onCheckedChange={() => handleFilterChange(filterType, option)}
                />
                <label
                  htmlFor={`${filterType}-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Access Denied. Please log in to view this page.</div>
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-5">Question Bank Dashboard</h1>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px]"
            />
            <Button variant="outline" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as QuestionStatus | "ALL" })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleBulkDelete} disabled={selectedQuestions.length === 0}>
            Delete Selected
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <FilterPopover filterType="exams" options={Array.from(new Set(questions.map((q) => q.exam)))} />
          <FilterPopover filterType="subjects" options={Array.from(new Set(questions.map((q) => q.subject)))} />
          <FilterPopover filterType="topics" options={Array.from(new Set(questions.map((q) => q.topic)))} />
          <FilterPopover filterType="subtopics" options={Array.from(new Set(questions.map((q) => q.subtopic)))} />
          <FilterPopover filterType="difficulties" options={Array.from(new Set(questions.map((q) => q.difficulty)))} />
          <FilterPopover filterType="types" options={Array.from(new Set(questions.map((q) => q.type)))} />
          <FilterPopover filterType="years" options={Array.from(new Set(questions.map((q) => q.year)))} />
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="batch-upload">Batch Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Manage your questions and track their performance.</CardDescription>
              </CardHeader>
              <CardContent>
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
                      <TableHead>Question</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Year</TableHead>
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
                        <TableCell className="font-medium">
                          <MathRenderer text={question.text.substring(0, 50) + "..."} />
                        </TableCell>
                        <TableCell>{question.subject}</TableCell>
                        <TableCell>{question.topic}</TableCell>
                        <TableCell>{question.difficulty}</TableCell>
                        <TableCell>{question.type}</TableCell>
                        <TableCell>{question.exam}</TableCell>
                        <TableCell>{question.year}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              question.status === "ACTIVE"
                                ? "default"
                                : question.status === "DRAFT"
                                ? "secondary"
                                : question.status === "ARCHIVED"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {question.status}
                          </Badge>
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
                              <DropdownMenuItem onClick={() => handleEdit(question)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(question.questionId)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  Showing <strong>1-{filteredQuestions.length}</strong> of{" "}
                  <strong>{filteredQuestions.length}</strong> questions
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="batch-upload">
            <Card>
              <CardHeader>
                <CardTitle>Batch Upload Questions</CardTitle>
                <CardDescription>Upload a batch of questions in JSON format.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={jsonInput}
                  onChange={handleJsonInputChange}
                  rows={10}
                  placeholder="Paste JSON of questions here..."
                  className="w-full p-2 border rounded"
                />
              </CardContent>
              <CardFooter>
                <Button
                  variant="default"
                  onClick={handleBatchUpload}
                  disabled={isLoading || batchUpload.length === 0}
                >
                  {isLoading ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Batch
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>Make changes to the question here. Click save when you&apos;re done.</DialogDescription>
            </DialogHeader>
            {editingQuestion && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-text" className="text-right">
                    Question Text
                  </label>
                  <Input
                    id="question-text"
                    value={editingQuestion.text}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, text: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-subject" className="text-right">
                    Subject
                  </label>
                  <Input
                    id="question-subject"
                    value={editingQuestion.subject}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, subject: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-topic" className="text-right">
                    Topic
                  </label>
                  <Input
                    id="question-topic"
                    value={editingQuestion.topic}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-difficulty" className="text-right">
                    Difficulty
                  </label>
                  <Select
                    value={editingQuestion.difficulty}
                    onValueChange={(value) =>
                      setEditingQuestion({ ...editingQuestion, difficulty: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-type" className="text-right">
                    Type
                  </label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(value) =>
                      setEditingQuestion({ ...editingQuestion, type: value as "Multiple Choice" | "Numerical" })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                      <SelectItem value="Numerical">Numerical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-exam" className="text-right">
                    Exam
                  </label>
                  <Input
                    id="question-exam"
                    value={editingQuestion.exam}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, exam: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-year" className="text-right">
                    Year
                  </label>
                  <Input
                    id="question-year"
                    value={editingQuestion.year}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, year: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="question-status" className="text-right">
                    Status
                  </label>
                  <Select
                    value={editingQuestion.status}
                    onValueChange={(value) =>
                      setEditingQuestion({ ...editingQuestion, status: value as QuestionStatus })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={() => editingQuestion && handleSaveEdit(editingQuestion)}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
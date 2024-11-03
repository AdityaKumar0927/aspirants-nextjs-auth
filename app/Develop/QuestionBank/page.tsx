"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import { QuestionBankSelector } from "@/components/QuestionBankSelector"
import QuestionBankSave from "@/components/QuestionBankSave"
import { QuestionBankActions } from "@/components/QuestionBankActions"
import Question from "@/components/shared/Question"
import { BookOpen, Code, Copy, Frame, GitFork, History, MessageSquare, MoreHorizontal, Plus, Redo, Share2, Search } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

interface QuestionType {
  questionId: string
  text: string
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  type: "Multiple Choice" | "Numerical"
  year: string
  reviewed: boolean
  completed: boolean
  options?: string[]
  correctOption?: string
  markscheme?: string
  notes?: string
  lastAttempted?: string
  diagramUrl?: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "UNDER_REVIEW"
  exam: string // Added this field
}

interface FiltersType {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: "all" | "review" | "complete"
}

export default function Develop() {
  const [questions, setQuestions] = useState<QuestionType[]>([])
  const [selectedBank, setSelectedBank] = useState<{ id: string; name: string; description: string } | null>(null)
  const [jsonInput, setJsonInput] = useState("")
  const [fileUploaded, setFileUploaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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
  const { toast } = useToast()

  const PAGE_SIZE = 10

  useEffect(() => {
    // Fetch questions from API
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions")
        const data = await response.json()
        setQuestions(data)
      } catch (error) {
        console.error("Error fetching questions:", error)
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again later.",
          variant: "destructive",
        })
      }
    }
    fetchQuestions()
  }, [toast])

  const handleFileUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const input = event.target.result as string
          try {
            const parsedQuestions = JSON.parse(input)
            setJsonInput(input)
            setQuestions(parsedQuestions)
            setFileUploaded(true)
          } catch (error) {
            console.error("Invalid JSON input:", error)
            toast({
              title: "Error",
              description: "Invalid JSON file. Please check the file and try again.",
              variant: "destructive",
            })
          }
        }
      }
      reader.readAsText(files[0])
    }
  }, [toast])

  const handleSaveQuestionBank = useCallback(async (name: string, description: string) => {
    try {
      const response = await fetch("/api/custom-question-banks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, customQuestions: questions }),
      })
      if (!response.ok) throw new Error("Failed to save question bank")
      const newBank = await response.json()
      setSelectedBank(newBank)
      toast({
        title: "Success",
        description: "Question bank saved successfully.",
      })
    } catch (error) {
      console.error("Error saving question bank:", error)
      toast({
        title: "Error",
        description: "Failed to save question bank. Please try again.",
        variant: "destructive",
      })
    }
  }, [questions, toast])

  const handleDeleteQuestionBank = useCallback(async (bankId: string) => {
    try {
      await fetch(`/api/custom-question-banks/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId }),
      })
      setSelectedBank(null)
      toast({
        title: "Success",
        description: "Question bank deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting question bank:", error)
      toast({
        title: "Error",
        description: "Failed to delete question bank. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.subtopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.subject.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters = 
      (!filters.exams.length || filters.exams.includes(question.exam)) &&
      (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
      (!filters.topics.length || filters.topics.includes(question.topic)) &&
      (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
      (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
      (!filters.years.length || filters.years.includes(question.year)) &&
      (!filters.types.length || filters.types.includes(question.type))

    if (filters.status === "review") {
      return matchesSearch && matchesFilters && question.reviewed
    } else if (filters.status === "complete") {
      return matchesSearch && matchesFilters && question.completed
    }

    return matchesSearch && matchesFilters
  })

  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="flex h-full w-full bg-background">
      {/* Left Sidebar */}
      <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-4">
        <Link href="#" className="p-2">
          <Frame className="h-6 w-6" />
        </Link>
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="icon" className="rounded-lg">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <BookOpen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <GitFork className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Bank Management Area */}
        <div className="w-[400px] border-r flex flex-col">
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Develop</span>
              <span>/</span>
              <span>Question Bank</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <QuestionBankSelector
                questionBanks={[]} // You need to implement this
                onSelect={(bank) => setSelectedBank(bank)}
              />
              <QuestionBankSave onSave={handleSaveQuestionBank} />
              {selectedBank && (
                <QuestionBankActions
                  bankId={selectedBank.id}
                  onDelete={() => handleDeleteQuestionBank(selectedBank.id)}
                />
              )}
              {!fileUploaded && (
                <div className="mt-4">
                  <FileUpload onChange={handleFileUpload} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between">
            <Tabs defaultValue="preview" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">JSON</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Tabs defaultValue="preview" className="flex-1 overflow-hidden">
            <TabsContent value="preview" className="flex-1 p-4 h-full overflow-hidden">
              <div className="mb-4 flex items-center">
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow mr-2"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="space-y-4">
                  {paginatedQuestions.map((question) => (
                    <Question
                      key={question.questionId}
                      question={question}
                      feedback=""
                      selectedOption=""
                      numericalAnswer=""
                      showMarkscheme={false}
                      handleOptionClick={() => {}}
                      handleNumericalSubmit={() => {}}
                      handleNumericalChange={() => {}}
                      handleMarkschemeToggle={() => {}}
                      handleMarkForReview={() => {}}
                      handleMarkComplete={() => {}}
                      isMarkedForReview={question.reviewed}
                      isMarkedComplete={question.completed}
                      markschemesDisabled={false}
                      note=""
                      handleNoteChange={() => {}}
                      userId=""
                      handleDeleteNote={async () => {}}
                      totalQuestions={filteredQuestions.length}
                      currentQuestionIndex={paginatedQuestions.indexOf(question)}
                      handleQuestionChange={() => {}}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="code" className="flex-1 p-4 h-full overflow-hidden">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste JSON here..."
                className="h-full font-mono resize-none"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
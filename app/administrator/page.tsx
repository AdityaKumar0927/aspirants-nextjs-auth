'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export type IssueArea = "CONTENT" | "UI" | "BUG" | "FEATURE" | "OTHER"
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  area: IssueArea
  createdAt: Date
  updatedAt: Date
  createdBy: {
    name: string | null
    email: string | null
  }
  questionId: string | null
  questionContent?: string
  feedbackDetails: {
    type: string
    fullText: string
    additionalInfo?: string
  }
}

const statusColors = {
  OPEN: "bg-yellow-500/20 text-yellow-700",
  IN_PROGRESS: "bg-blue-500/20 text-blue-700",
  RESOLVED: "bg-green-500/20 text-green-700",
  CLOSED: "bg-gray-500/20 text-gray-700",
}

const priorityColors = {
  LOW: "bg-gray-500/20 text-gray-700",
  MEDIUM: "bg-orange-500/20 text-orange-700",
  HIGH: "bg-red-500/20 text-red-700",
  CRITICAL: "bg-purple-500/20 text-purple-700",
}

export default function IssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'All'>('All')
  const [areaFilter, setAreaFilter] = useState<IssueArea | 'All'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newIssue, setNewIssue] = useState<Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    area: 'OTHER',
    questionId: null,
    feedbackDetails: {
      type: 'OTHER',
      fullText: '',
    },
  })
  const [userRole, setUserRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10
  const { toast } = useToast()

  const canCreateIssue = userRole && userRole !== 'member'

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch('/api/issues')
      if (!response.ok) throw new Error('Failed to fetch issues')
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error('Error fetching issues:', error)
      toast({
        title: "Error",
        description: "Failed to fetch issues. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchUserRole = useCallback(async () => {
    try {
      setUserRole('administrator') // Assuming this is an admin page
    } catch (error) {
      console.error('Failed to set user role:', error)
    }
  }, [])

  useEffect(() => {
    fetchIssues()
    fetchUserRole()
  }, [fetchIssues, fetchUserRole])

  useEffect(() => {
    const filtered = issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.feedbackDetails.fullText.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter
      const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter
      const matchesArea = areaFilter === "All" || issue.area === areaFilter
      return matchesSearch && matchesStatus && matchesPriority && matchesArea
    })
    setFilteredIssues(filtered)
    setCurrentPage(1)
  }, [issues, searchQuery, statusFilter, priorityFilter, areaFilter])

  const refreshIssues = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchIssues()
      toast({
        title: "Success",
        description: "Issues refreshed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh issues. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchIssues, toast])

  const handleStatusUpdate = useCallback(async (id: string, status: IssueStatus) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update issue status')

      const updatedIssue = await response.json()
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === id ? { ...issue, status: updatedIssue.status } : issue
        )
      )

      toast({
        title: "Success",
        description: `Issue status updated to ${status}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update issue status.",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIssue),
      })

      if (!response.ok) throw new Error('Failed to create issue')

      const createdIssue = await response.json()
      setIssues((prevIssues) => [createdIssue, ...prevIssues])
      setIsCreateDialogOpen(false)
      setNewIssue({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        area: 'OTHER',
        questionId: null,
        feedbackDetails: {
          type: 'OTHER',
          fullText: '',
        },
      })

      toast({
        title: "Success",
        description: "New issue created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new issue. Please try again.",
        variant: "destructive",
      })
    }
  }

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage)
  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton width={200} height={24} />
            <Skeleton width={150} height={20} />
          </CardHeader>
          <CardContent>
            <Skeleton count={3} />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <h1 className="text-xl font-semibold">Issues</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive view of user feedback and reported issues
          </p>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues and feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IssueStatus | 'All')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as IssuePriority | 'All')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={(value) => setAreaFilter(value as IssueArea | 'All')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Areas</SelectItem>
                <SelectItem value="CONTENT">Content</SelectItem>
                <SelectItem value="UI">UI</SelectItem>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="FEATURE">Feature</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={refreshIssues}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreateIssue && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Issue</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new issue.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateIssue}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={newIssue.title}
                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newIssue.description}
                        onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="priority" className="text-right">
                        Priority
                      </Label>
                      <Select
                        value={newIssue.priority}
                        onValueChange={(value) => setNewIssue({ ...newIssue, priority: value as IssuePriority })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="area" className="text-right">
                        Area
                      </Label>
                      <Select
                        value={newIssue.area}
                        onValueChange={(value) => setNewIssue({
                          ...newIssue,
                          area: value as IssueArea,
                          feedbackDetails: {
                            ...newIssue.feedbackDetails,
                            type: value,
                          },
                        })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONTENT">Content</SelectItem>
                          <SelectItem value="UI">UI</SelectItem>
                          <SelectItem value="BUG">Bug</SelectItem>
                          <SelectItem value="FEATURE">Feature</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="feedbackFullText" className="text-right">
                        Feedback Details
                      </Label>
                      <Textarea
                        id="feedbackFullText"
                        value={newIssue.feedbackDetails.fullText}
                        onChange={(e) => setNewIssue({
                          ...newIssue,
                          feedbackDetails: {
                            ...newIssue.feedbackDetails,
                            fullText: e.target.value,
                          },
                        })}
                        className="col-span-3"
                        placeholder="Enter full feedback text here..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Issue</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : paginatedIssues.length > 0 ? (
          <div className="space-y-4">
            {paginatedIssues.map((issue) => (
              <Accordion type="single" collapsible key={issue.id}>
                <AccordionItem value={issue.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2 py-0.5 text-xs font-normal ${
                              statusColors[issue.status]
                            }`}
                          >
                            {issue.status === "IN_PROGRESS"
                              ? "In Progress"
                              : issue.status.charAt(0) +
                                issue.status.slice(1).toLowerCase()}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2 py-0.5 text-xs font-normal ${
                              priorityColors[issue.priority]
                            }`}
                          >
                            {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {issue.id}
                          </span>
                        </div>
                        <h2 className="text-lg font-medium mt-1">{issue.title}</h2>
                      </div>
                      <Select
                        value={issue.status}
                        onValueChange={(value) => handleStatusUpdate(issue.id, value as IssueStatus)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardHeader>
                        <CardTitle>Issue Details</CardTitle>
                        <CardDescription>
                          Created on {new Date(issue.createdAt).toLocaleString()} by {issue.createdBy.name ?? 'Unknown'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-semibold">Description</h3>
                          <p>{issue.description}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold">Feedback Details</h3>
                          <p><strong>Type:</strong> {issue.feedbackDetails.type}</p>
                          <p><strong>Full Text:</strong> {issue.feedbackDetails.fullText}</p>
                          {issue.feedbackDetails.additionalInfo && (
                            <p><strong>Additional Info:</strong> {issue.feedbackDetails.additionalInfo}</p>
                          )}
                        </div>
                        {issue.questionId && (
                          <div>
                            <h3 className="font-semibold">Related Question</h3>
                            <p><strong>Question ID:</strong> {issue.questionId}</p>
                            {issue.questionContent && (
                              <p><strong>Question Content:</strong> {issue.questionContent}</p>
                            )}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">Area</h3>
                          <p>{issue.area}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No issues found. Try adjusting your filters or create a new issue.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
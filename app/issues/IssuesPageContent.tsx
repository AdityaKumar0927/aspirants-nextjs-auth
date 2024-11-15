"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, MoreHorizontal, Plus, RefreshCw, Search, ArrowUpDown } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export type IssueArea = "CONTENT" | "UI" | "BUG" | "FEATURE" | "OTHER"
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  area: IssueArea
  createdAt: string
  updatedAt: string
  createdBy: {
    name: string | null
    email: string | null
  }
  questionId: string | null
}

type Role = 'member' | 'volunteer' | 'moderator' | 'administrator'

interface IssuesPageContentProps {
  initialIssues: Issue[]
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

export default function IssuesPageContent({ initialIssues }: IssuesPageContentProps) {
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>(initialIssues)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [priorityFilter, setPriorityFilter] = useState<string>("All")
  const [areaFilter, setAreaFilter] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Issue | 'createdBy.name', direction: 'asc' | 'desc' } | null>(null)
  const [date, setDate] = useState<Date>()
  const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false)
  const [newIssue, setNewIssue] = useState<Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    title: '',
    description: '',
    priority: 'LOW',
    area: 'OTHER',
    status: 'OPEN',
    questionId: null
  })
  const router = useRouter()
  const { toast } = useToast()

  const itemsPerPage = 10

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user/role')
        if (!response.ok) {
          throw new Error('Failed to fetch user role')
        }
        const data = await response.json()
        setUserRole(data.role)
      } catch (error) {
        console.error('Error fetching user role:', error)
        toast({
          title: "Error",
          description: "Failed to fetch user role. Some features may be unavailable.",
          variant: "destructive",
        })
      }
    }

    fetchUserRole()
  }, [toast])

  useEffect(() => {
    const filtered = issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter
      const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter
      const matchesArea = areaFilter === "All" || issue.area === areaFilter
      return matchesSearch && matchesStatus && matchesPriority && matchesArea
    })
    setFilteredIssues(filtered)
    setCurrentPage(1)
  }, [issues, searchQuery, statusFilter, priorityFilter, areaFilter])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/issues")
      if (!response.ok) {
        throw new Error("Failed to fetch issues")
      }
      const data = await response.json()
      setIssues(data)
      setFilteredIssues(data)
    } catch (error) {
      console.error("Error fetching issues:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchIssues()
  }

  const handleCreateIssue = async () => {
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newIssue),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create issue")
      }

      const createdIssue = await response.json()
      setIssues([createdIssue, ...issues])
      setIsCreateIssueDialogOpen(false)
      setNewIssue({ title: '', description: '', priority: 'LOW', area: 'OTHER', status: 'OPEN', questionId: null })
      toast({
        title: "Success",
        description: "Issue created successfully",
      })
    } catch (error) {
      console.error("Error creating issue:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create issue. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSort = (key: keyof Issue | 'createdBy.name') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedIssues = React.useMemo(() => {
    let sortableIssues = [...filteredIssues]
    if (sortConfig !== null) {
      sortableIssues.sort((a, b) => {
        if (sortConfig.key === 'createdBy.name') {
          const nameA = a.createdBy.name ?? ''
          const nameB = b.createdBy.name ?? ''
          return sortConfig.direction === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA)
        } else {
          const valueA = a[sortConfig.key]
          const valueB = b[sortConfig.key]
          if (valueA === null && valueB === null) return 0
          if (valueA === null) return sortConfig.direction === 'asc' ? 1 : -1
          if (valueB === null) return sortConfig.direction === 'asc' ? -1 : 1
          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortConfig.direction === 'asc' 
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA)
          }
          return sortConfig.direction === 'asc' 
            ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
            : (valueB < valueA ? -1 : valueB > valueA ? 1 : 0)
        }
      })
    }
    return sortableIssues
  }, [filteredIssues, sortConfig])

  const paginatedIssues = sortedIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage)

  const canResolveIssues = userRole === 'moderator' || userRole === 'administrator'
  const canApproveChanges = userRole === 'administrator'
  const canViewDetailedInfo = userRole === 'moderator' || userRole === 'administrator'
  const canCreateIssue = userRole && userRole !== 'member'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <h1 className="text-xl font-semibold">Issues</h1>
          <p className="text-sm text-muted-foreground">
            Continuously tracking from your feedback
          </p>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue={statusFilter} onValueChange={setStatusFilter}>
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
            <Select defaultValue={priorityFilter} onValueChange={setPriorityFilter}>
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
            <Select defaultValue={areaFilter} onValueChange={setAreaFilter}>
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
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreateIssue && (
            <Button onClick={() => setIsCreateIssueDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Button>
          )}
        </div>

        <div className="rounded-lg border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading issues...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              {error}
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-normal",
                          statusColors[issue.status]
                        )}
                      >
                        {issue.status === "IN_PROGRESS"
                          ? "In Progress"
                          : issue.status.charAt(0) +
                            issue.status.slice(1).toLowerCase()}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-normal",
                          priorityColors[issue.priority]
                        )}
                      >
                        {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {issue.id}
                      </span>
                    </div>
                    <h2 className="mt-1 font-medium">{issue.title}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{issue.area.toLowerCase()}</span>
                      <span>•</span>
                      <span>
                        {new Date(issue.createdAt).toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>by {issue.createdBy.name ?? 'Unknown'}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setSelectedIssue(issue)}>View Details</DropdownMenuItem>
                      {canResolveIssues && (
                        <DropdownMenuItem>Resolve Issue</DropdownMenuItem>
                      )}
                      {canApproveChanges && (
                        <DropdownMenuItem>Approve Changes</DropdownMenuItem>
                      )}
                      {canViewDetailedInfo && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
        {paginatedIssues.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sortedIssues.length)} of{" "}
              {sortedIssues.length} issues
            </p>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
            <DialogDescription>Issue Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>ID:</strong> {selectedIssue?.id}</p>
            <p><strong>Description:</strong> {selectedIssue?.description}</p>
            <p><strong>Status:</strong> {selectedIssue?.status}</p>
            <p><strong>Priority:</strong> {selectedIssue?.priority}</p>
            <p><strong>Area:</strong> {selectedIssue?.area}</p>
            <p><strong>Created At:</strong> {selectedIssue?.createdAt}</p>
            <p><strong>Updated At:</strong> {selectedIssue?.updatedAt}</p>
            <p><strong>Created By:</strong> {selectedIssue?.createdBy.name ?? 'Unknown'} ({selectedIssue?.createdBy.email ?? 'No email'})</p>
            {selectedIssue?.questionId && <p><strong>Related Question ID:</strong> {selectedIssue.questionId}</p>}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateIssueDialogOpen} onOpenChange={setIsCreateIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>Fill in the details to create a new issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newIssue.priority}
                onValueChange={(value) => setNewIssue({ ...newIssue, priority: value as IssuePriority })}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="area">Area</Label>
              <Select
                value={newIssue.area}
                onValueChange={(value) => setNewIssue({ ...newIssue, area: value as IssueArea })}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="questionId">Related Question ID (Optional)</Label>
              <Input
                id="questionId"
                value={newIssue.questionId || ''}
                onChange={(e) => setNewIssue({ ...newIssue, questionId: e.target.value || null })}
                placeholder="Enter related question ID if applicable"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateIssue}>Create Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
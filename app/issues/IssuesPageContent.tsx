'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Search, HelpCircle, ChevronDown, Plus, RefreshCw, CalendarIcon, MoreHorizontal, Filter } from 'lucide-react'
import FeedbackPopover from "@/components/shared/FeedbackPopover"

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

export default function IssuesPageContent() {
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [userIssues, setUserIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [areaFilter, setAreaFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Issue | 'createdBy.name', direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' })
  const [date, setDate] = useState<Date>()
  const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [newIssue, setNewIssue] = useState<Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    title: '',
    description: '',
    priority: 'LOW',
    area: 'OTHER',
    status: 'OPEN',
    questionId: null
  })
  const [viewAllIssues, setViewAllIssues] = useState(false)
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
    const fetchIssues = async () => {
      setLoading(true)
      try {
        const [allIssuesResponse, userIssuesResponse] = await Promise.all([
          fetch("/api/issues"),
          fetch("/api/issues?user=true")
        ])
        if (!allIssuesResponse.ok || !userIssuesResponse.ok) {
          throw new Error("Failed to fetch issues")
        }
        const allIssuesData = await allIssuesResponse.json()
        const userIssuesData = await userIssuesResponse.json()
        setIssues(allIssuesData)
        setUserIssues(userIssuesData)
        setFilteredIssues(userIssuesData)
      } catch (error) {
        console.error("Error fetching issues:", error)
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
  }, [])

  useEffect(() => {
    const filtered = (viewAllIssues ? issues : userIssues).filter((issue) => {
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter.toUpperCase()
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter.toUpperCase()
      const matchesArea = areaFilter === "all" || issue.area === areaFilter.toUpperCase()
      return matchesSearch && matchesStatus && matchesPriority && matchesArea
    })
    setFilteredIssues(filtered)
    setCurrentPage(1)
  }, [issues, userIssues, viewAllIssues, searchQuery, statusFilter, priorityFilter, areaFilter])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [allIssuesResponse, userIssuesResponse] = await Promise.all([
        fetch("/api/issues"),
        fetch("/api/issues?user=true")
      ])
      if (!allIssuesResponse.ok || !userIssuesResponse.ok) {
        throw new Error("Failed to fetch issues")
      }
      const allIssuesData = await allIssuesResponse.json()
      const userIssuesData = await userIssuesResponse.json()
      setIssues(allIssuesData)
      setUserIssues(userIssuesData)
      setFilteredIssues(viewAllIssues ? allIssuesData : userIssuesData)
    } catch (error) {
      console.error("Error fetching issues:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
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
      setIssues(prevIssues => [createdIssue, ...prevIssues])
      setUserIssues(prevUserIssues => [createdIssue, ...prevUserIssues])
      setFilteredIssues(prevFilteredIssues => [createdIssue, ...prevFilteredIssues])
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
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-medium mb-2">Report Issues</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Create and view support cases for your projects.
          </p>
        </div>
        {canCreateIssue && (
          <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto" onClick={() => setIsCreateIssueDialogOpen(true)}>
            Create Case
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Button variant="outline" size="icon" onClick={() => setIsFilterDialogOpen(true)} className="sm:hidden">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="hidden sm:block">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onValueChange={(value) => {
              const [key, direction] = value.split('-')
              handleSort(key as keyof Issue | 'createdBy.name')
            }}
          >
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt-desc">Last Updated</SelectItem>
              <SelectItem value="createdAt-desc">Created Date</SelectItem>
              <SelectItem value="priority-desc">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal w-full sm:w-[240px]",
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
          <Button 
            onClick={() => {
              setViewAllIssues(!viewAllIssues)
              setFilteredIssues(viewAllIssues ? userIssues : issues)
            }} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            {viewAllIssues ? "My Issues" : "All Issues"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-gray-50">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : paginatedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-gray-50">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">No cases yet</h2>
          <p className="text-gray-500 mb-6">Create a new case to get started</p>
          {canCreateIssue && (
            <Button onClick={() => setIsCreateIssueDialogOpen(true)}>Create Case</Button>
          )}
          <FeedbackPopover questionId="example-question-id" />
        </div>
        
      ) : (
        <div className="space-y-4">
          {paginatedIssues.map((issue) => (
            <div key={issue.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={`${statusColors[issue.status]} px-2 py-0.5 text-xs font-normal`}
                  >
                    {issue.status === "IN_PROGRESS"
                      ? "In Progress"
                      : issue.status.charAt(0) + issue.status.slice(1).toLowerCase()}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`${priorityColors[issue.priority]} px-2 py-0.5 text-xs font-normal`}
                  >
                    {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {issue.id.replace('cm3oyfu850000me035l9m6hlb', '')}
                  </span>
                </div>
                <h2 className="text-lg font-medium mb-1">{issue.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{issue.area.toLowerCase()}</span>
                  <span>•</span>
                  <span>
                    Updated {new Date(issue.updatedAt).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                      month: "short",
                      day: "numeric",
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

      {paginatedIssues.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedIssues.length)} of{" "}
            {sortedIssues.length} issues
          </p>
          <div className="space-x-2 order-1 sm:order-2">
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

      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
            <DialogDescription>Issue Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Description:</strong> {selectedIssue?.description}</p>
            <p><strong>Status:</strong> {selectedIssue?.status}</p>
            <p><strong>Priority:</strong> {selectedIssue?.priority}</p>
            <p><strong>Area:</strong> {selectedIssue?.area}</p>
            <p><strong>Created At:</strong> {selectedIssue?.createdAt}</p>
            <p><strong>Updated At:</strong> {selectedIssue?.updatedAt}</p>
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

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Issues</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Area</Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
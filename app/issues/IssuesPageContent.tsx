"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Search, HelpCircle, ChevronDown, Plus, RefreshCw } from 'lucide-react'

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
  const [userIssues, setUserIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [areaFilter, setAreaFilter] = useState<string>("all") // Added areaFilter state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Issue | 'createdBy.name', direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' })
  const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false)
  const [newIssue, setNewIssue] = useState<Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    title: '',
    description: '',
    priority: 'LOW',
    area: 'OTHER',
    status: 'OPEN',
    questionId: null
  })
  const [viewAllIssues, setViewAllIssues] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
      const matchesArea = areaFilter === "all" || issue.area === areaFilter // Updated filtering logic
      return matchesSearch && matchesStatus && matchesArea
    })
    setFilteredIssues(filtered)
  }, [issues, userIssues, viewAllIssues, searchQuery, statusFilter, areaFilter]) // Added areaFilter to dependencies

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

  const canCreateIssue = userRole && userRole !== 'member'

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-medium mb-2">Support Center</h1>
          <p className="text-gray-500">
            Create and view support cases for your projects.{" "}
            <Link href="#" className="text-blue-500 hover:text-blue-600 inline-flex items-center">
              Learn more
              <ExternalLink className="h-4 w-4 ml-1" />
            </Link>
          </p>
        </div>
        {canCreateIssue && (
          <Button className="bg-black text-white hover:bg-gray-800" onClick={() => setIsCreateIssueDialogOpen(true)}>
            Create Case
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 items-center">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Statuses</TabsTrigger> {/* Updated Tabs */}
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onValueChange={(value) => {
              const [key, direction] = value.split('-')
              handleSort(key as keyof Issue | 'createdBy.name')
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt-desc">Sort by Last Updated</SelectItem>
              <SelectItem value="createdAt-desc">Sort by Created Date</SelectItem>
              <SelectItem value="priority-desc">Sort by Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
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
      ) : sortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-gray-50">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">No cases yet</h2>
          <p className="text-gray-500 mb-6">Create a new case to get started</p>
          {canCreateIssue && (
            <Button onClick={() => setIsCreateIssueDialogOpen(true)}>Create Case</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIssues.map((issue) => (
            <div key={issue.id} className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
                    {issue.id}
                  </span>
                </div>
                <h2 className="text-lg font-medium mb-1">{issue.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
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
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}

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
                  <SelectItem value="all">All Areas</SelectItem> {/* Added All Areas option */}
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
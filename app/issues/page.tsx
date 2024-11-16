"use client"

import { useState, useEffect } from 'react'
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
import { RefreshCw, Search, Plus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

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

export default function UserIssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'All'>('All')
  const [areaFilter, setAreaFilter] = useState<IssueArea | 'All'>('All')
  const [showAllIssues, setShowAllIssues] = useState(false)
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as IssuePriority,
    area: 'OTHER' as IssueArea,
  })

  useEffect(() => {
    fetchIssues()
  }, [])

  useEffect(() => {
    filterIssues()
  }, [issues, searchQuery, statusFilter, priorityFilter, areaFilter, showAllIssues])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues')
      if (!response.ok) throw new Error('Failed to fetch issues')
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error('Error fetching issues:', error)
    }
  }

  const filterIssues = () => {
    const filtered = issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter
      const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter
      const matchesArea = areaFilter === "All" || issue.area === areaFilter
      const matchesUser = showAllIssues || issue.createdBy.email === 'current_user@example.com' // Replace with actual user email
      return matchesSearch && matchesStatus && matchesPriority && matchesArea && matchesUser
    })
    setFilteredIssues(filtered)
  }

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
      setNewIssue({
        title: '',
        description: '',
        priority: 'MEDIUM',
        area: 'OTHER',
      })
    } catch (error) {
      console.error('Error creating issue:', error)
    }
  }

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
          <Button variant="outline" size="sm" onClick={fetchIssues}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-issues"
              checked={showAllIssues}
              onCheckedChange={setShowAllIssues}
            />
            <Label htmlFor="show-all-issues">Show all issues</Label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create New Issue
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <form onSubmit={handleCreateIssue}>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Create New Issue</h4>
                    <p className="text-sm text-muted-foreground">
                      Fill in the details to create a new issue.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newIssue.priority}
                      onValueChange={(value) => setNewIssue({ ...newIssue, priority: value as IssuePriority })}
                    >
                      <SelectTrigger id="priority">
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
                  <div className="grid gap-2">
                    <Label htmlFor="area">Area</Label>
                    <Select
                      value={newIssue.area}
                      onValueChange={(value) => setNewIssue({ ...newIssue, area: value as IssueArea })}
                    >
                      <SelectTrigger id="area">
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
                  <Button type="submit">Create Issue</Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>

        <div className="rounded-lg border">
          <div className="divide-y">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50"
              >
                <div className="flex-1">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
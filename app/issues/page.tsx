"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ChevronDown, Plus, RefreshCw, Search, ArrowUpDown } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Role = 'member' | 'volunteer' | 'moderator' | 'administrator'

interface Issue {
  id: string
  title: string
  description: string
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  area: "CONTENT" | "UI" | "BUG" | "FEATURE" | "OTHER"
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

const statusColors = {
  OPEN: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-gray-500",
}

const priorityColors = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-orange-500",
  HIGH: "bg-red-500",
  CRITICAL: "bg-purple-500",
}

const areaColors = {
  CONTENT: "bg-blue-200 text-blue-800",
  UI: "bg-green-200 text-green-800",
  BUG: "bg-red-200 text-red-800",
  FEATURE: "bg-purple-200 text-purple-800",
  OTHER: "bg-gray-200 text-gray-800",
}

const roleColors = {
  member: "bg-green-200 text-green-800",
  volunteer: "bg-blue-200 text-blue-800",
  moderator: "bg-purple-200 text-purple-800",
  administrator: "bg-red-200 text-red-800",
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [priorityFilter, setPriorityFilter] = useState<string>("All")
  const [areaFilter, setAreaFilter] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Issue | 'createdBy.name', direction: 'asc' | 'desc' } | null>(null)
  const router = useRouter()

  const itemsPerPage = 10

  useEffect(() => {
    fetchIssues()
  }, [])

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
      setError("Failed to load issues. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchIssues()
  }

  const handleCreateIssue = () => {
    // Implement create issue functionality
    console.log("Create new issue")
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
          if (a.createdBy.name < b.createdBy.name) return sortConfig.direction === 'asc' ? -1 : 1
          if (a.createdBy.name > b.createdBy.name) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
          if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Issue Tracker</h1>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Reported Issues</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleCreateIssue} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                Retry
              </Button>
            </Alert>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[180px]">
                      {statusFilter} <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["All", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
                      <DropdownMenuItem key={status} onSelect={() => setStatusFilter(status)}>
                        {status === "All" ? status : status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[180px]">
                      {priorityFilter} <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => (
                      <DropdownMenuItem key={priority} onSelect={() => setPriorityFilter(priority)}>
                        {priority === "All" ? priority : priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[180px]">
                      {areaFilter} <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Area</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["All", "CONTENT", "UI", "BUG", "FEATURE", "OTHER"].map((area) => (
                      <DropdownMenuItem key={area} onSelect={() => setAreaFilter(area)}>
                        {area === "All" ? area : area.charAt(0) + area.slice(1).toLowerCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {paginatedIssues.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button variant="ghost" onClick={() => handleSort('id')}>
                            ID
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('title')}>
                            Title
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('status')}>
                            Status
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('priority')}>
                            Priority
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                            Created At
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={() => handleSort('createdBy.name')}>
                            Created By
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>{issue.id}</TableCell>
                          <TableCell>{issue.title}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[issue.status]}>{issue.status.charAt(0) + issue.status.slice(1).toLowerCase().replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[issue.priority]}>{issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}</Badge>
                          </TableCell>
                          <TableCell>{new Date(issue.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={areaColors[issue.area]}>
                              {issue.area.charAt(0) + issue.area.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{issue.createdBy.name}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedIssue(issue)}>
                                  View Details
                                </Button>
                              </DialogTrigger>
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
                                  <p><strong>Created By:</strong> {selectedIssue?.createdBy.name} ({selectedIssue?.createdBy.email})</p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-500">No issues found.</p>
                </div>
              )}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
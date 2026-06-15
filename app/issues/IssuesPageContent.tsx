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
import { Search, HelpCircle, RefreshCw, CalendarIcon, MoreHorizontal, Filter } from 'lucide-react'
import FeedbackPopover from "@/components/question-bank/FeedbackPopover"
import T from "@/components/i18n/T"

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

// Desk status marks — small dots in the CBT legend, never colored pills.
const statusDots = {
  OPEN: "bg-st-notvisited",
  IN_PROGRESS: "bg-st-review",
  RESOLVED: "bg-st-answered",
  CLOSED: "bg-pencil",
}

const priorityDots = {
  LOW: "bg-st-notvisited",
  MEDIUM: "bg-pencil",
  HIGH: "bg-ink",
  CRITICAL: "bg-redpen",
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
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
            <T k="auto.issuesIssuespagecontent.supportCaseRegister" />
          </p>
          <h1 className="type-display mb-2 mt-1 text-2xl sm:text-3xl">
            <T k="auto.issuesIssuespagecontent.report" /> <span className="highlight-sweep"><T k="auto.issuesIssuespagecontent.issues" /></span>
          </h1>
          <p className="text-pencil text-sm sm:text-base">
            <T k="auto.issuesIssuespagecontent.raiseACaseTrackIts" />
          </p>
        </div>
        {canCreateIssue && (
          <Button className="min-h-11 w-full sm:w-auto" onClick={() => setIsCreateIssueDialogOpen(true)}>
            <T k="auto.issuesIssuespagecontent.createCase" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pencil h-4 w-4" />
          <Input
            placeholder="Search cases"
            className="pl-10 w-full bg-paper"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Button variant="outline" size="icon" onClick={() => setIsFilterDialogOpen(true)} className="min-h-11 min-w-11 sm:hidden">
            <Filter className="h-4 w-4" />
            <span className="sr-only"><T k="auto.issuesIssuespagecontent.filterCases" /></span>
          </Button>
          <div className="hidden sm:block">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all"><T k="auto.issuesIssuespagecontent.all" /></TabsTrigger>
                <TabsTrigger value="open"><T k="auto.issuesIssuespagecontent.open" /></TabsTrigger>
                <TabsTrigger value="in_progress"><T k="auto.issuesIssuespagecontent.inProgress" /></TabsTrigger>
                <TabsTrigger value="resolved"><T k="auto.issuesIssuespagecontent.resolved" /></TabsTrigger>
                <TabsTrigger value="closed"><T k="auto.issuesIssuespagecontent.closed" /></TabsTrigger>
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
              <SelectItem value="updatedAt-desc"><T k="auto.issuesIssuespagecontent.lastUpdated" /></SelectItem>
              <SelectItem value="createdAt-desc"><T k="auto.issuesIssuespagecontent.createdDate" /></SelectItem>
              <SelectItem value="priority-desc"><T k="auto.issuesIssuespagecontent.priority" /></SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} className="min-h-11 min-w-11">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only"><T k="auto.issuesIssuespagecontent.refreshCases" /></span>
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
              <SelectItem value="all"><T k="auto.issuesIssuespagecontent.allPriorities" /></SelectItem>
              <SelectItem value="low"><T k="auto.issuesIssuespagecontent.low" /></SelectItem>
              <SelectItem value="medium"><T k="auto.issuesIssuespagecontent.medium" /></SelectItem>
              <SelectItem value="high"><T k="auto.issuesIssuespagecontent.high" /></SelectItem>
              <SelectItem value="critical"><T k="auto.issuesIssuespagecontent.critical" /></SelectItem>
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><T k="auto.issuesIssuespagecontent.allAreas" /></SelectItem>
              <SelectItem value="content"><T k="auto.issuesIssuespagecontent.content" /></SelectItem>
              <SelectItem value="ui"><T k="auto.issuesIssuespagecontent.ui" /></SelectItem>
              <SelectItem value="bug"><T k="auto.issuesIssuespagecontent.bug" /></SelectItem>
              <SelectItem value="feature"><T k="auto.issuesIssuespagecontent.feature" /></SelectItem>
              <SelectItem value="other"><T k="auto.issuesIssuespagecontent.other" /></SelectItem>
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
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={() => {
              setViewAllIssues(!viewAllIssues)
              setFilteredIssues(viewAllIssues ? userIssues : issues)
            }} 
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
          >
            {viewAllIssues ? "My cases" : "All cases"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="paper-sheet flex items-center space-x-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="paper-sheet flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 rounded-full border border-rule flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-redpen" />
          </div>
          <h2 className="type-display text-xl mb-2"><T k="auto.issuesIssuespagecontent.somethingWentWrong" /></h2>
          <p className="text-pencil mb-6">{error}</p>
          <Button onClick={handleRefresh} className="min-h-11">
            <RefreshCw className="mr-2 h-4 w-4" />
            <T k="auto.issuesIssuespagecontent.retry" />
          </Button>
        </div>
      ) : paginatedIssues.length === 0 ? (
        <div className="paper-sheet flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 rounded-full border border-rule flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-pencil" />
          </div>
          <h2 className="type-display text-xl mb-2"><T k="auto.issuesIssuespagecontent.noCasesOnTheRegister" /></h2>
          <p className="text-pencil mb-6"><T k="auto.issuesIssuespagecontent.createACaseToGet" /></p>
          {canCreateIssue && (
            <Button onClick={() => setIsCreateIssueDialogOpen(true)} className="min-h-11"><T k="auto.issuesIssuespagecontent.createCase" /></Button>
          )}
          <FeedbackPopover questionId="example-question-id" />
        </div>

      ) : (
        <div className="paper-sheet px-4 sm:px-6">
          {paginatedIssues.map((issue) => (
            <div key={issue.id} className="ledger-row flex-col items-start gap-2 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <span className="type-data flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-ink">
                    <span
                      className={`h-2 w-2 rounded-full ${statusDots[issue.status]}`}
                      aria-hidden="true"
                    />
                    {issue.status === "IN_PROGRESS"
                      ? "In Progress"
                      : issue.status.charAt(0) + issue.status.slice(1).toLowerCase()}
                  </span>
                  <span className="type-data flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-pencil">
                    <span
                      className={`h-2 w-2 rounded-full ${priorityDots[issue.priority]}`}
                      aria-hidden="true"
                    />
                    {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                  </span>
                  <span className="type-data text-xs text-pencil">
                    {issue.id.replace('cm3oyfu850000me035l9m6hlb', '')}
                  </span>
                </div>
                <h2 className="text-lg font-medium text-ink mb-1">{issue.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-pencil">
                  <span>{issue.area.toLowerCase()}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <T k="auto.issuesIssuespagecontent.updated" />{" "}
                    <span className="type-data">
                      {new Date(issue.updatedAt).toLocaleString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span><T k="auto.issuesIssuespagecontent.by" /> {issue.createdBy.name ?? 'Unknown'}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="min-h-11">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only"><T k="auto.issuesIssuespagecontent.caseActions" /></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setSelectedIssue(issue)}><T k="auto.issuesIssuespagecontent.viewDetails" /></DropdownMenuItem>
                  {canResolveIssues && (
                    <DropdownMenuItem><T k="auto.issuesIssuespagecontent.resolveIssue" /></DropdownMenuItem>
                  )}
                  {canApproveChanges && (
                    <DropdownMenuItem><T k="auto.issuesIssuespagecontent.approveChanges" /></DropdownMenuItem>
                  )}
                  {canViewDetailedInfo && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <T k="auto.issuesIssuespagecontent.delete" />
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
          <p className="text-sm text-pencil order-2 sm:order-1">
            <T k="auto.issuesIssuespagecontent.showing" /> <span className="type-data text-ink">{(currentPage - 1) * itemsPerPage + 1}</span> <T k="auto.issuesIssuespagecontent.to" />{" "}
            <span className="type-data text-ink">{Math.min(currentPage * itemsPerPage, sortedIssues.length)}</span> <T k="auto.issuesIssuespagecontent.of" />{" "}
            <span className="type-data text-ink">{sortedIssues.length}</span> <T k="auto.issuesIssuespagecontent.cases" />
          </p>
          <div className="space-x-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <T k="auto.issuesIssuespagecontent.previous" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <T k="auto.issuesIssuespagecontent.next" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="paper-sheet">
          <DialogHeader>
            <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
              <T k="auto.issuesIssuespagecontent.caseDetails" />
            </p>
            <DialogTitle className="type-display">{selectedIssue?.title}</DialogTitle>
          </DialogHeader>
          <div>
            <div className="ledger-row items-start py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.description" /></span>
              <span className="text-sm text-ink">{selectedIssue?.description}</span>
            </div>
            <div className="ledger-row py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.status" /></span>
              <span className="type-data text-sm text-ink">{selectedIssue?.status}</span>
            </div>
            <div className="ledger-row py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.priority" /></span>
              <span className="type-data text-sm text-ink">{selectedIssue?.priority}</span>
            </div>
            <div className="ledger-row py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.area" /></span>
              <span className="type-data text-sm text-ink">{selectedIssue?.area}</span>
            </div>
            <div className="ledger-row py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.created" /></span>
              <span className="type-data text-sm text-ink">{selectedIssue?.createdAt}</span>
            </div>
            <div className="ledger-row py-2">
              <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.updated" /></span>
              <span className="type-data text-sm text-ink">{selectedIssue?.updatedAt}</span>
            </div>
            {selectedIssue?.questionId && (
              <div className="ledger-row border-b-0 py-2">
                <span className="type-data w-28 flex-none text-[11px] uppercase tracking-[0.14em] text-pencil"><T k="auto.issuesIssuespagecontent.questionId" /></span>
                <span className="type-data text-sm text-ink">{selectedIssue.questionId}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateIssueDialogOpen} onOpenChange={setIsCreateIssueDialogOpen}>
        <DialogContent className="paper-sheet">
          <DialogHeader>
            <DialogTitle className="type-display"><T k="auto.issuesIssuespagecontent.createACase" /></DialogTitle>
            <DialogDescription className="text-pencil"><T k="auto.issuesIssuespagecontent.describeTheProblemSoThe" /></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title"><T k="auto.issuesIssuespagecontent.title" /></Label>
              <Input
                id="title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description"><T k="auto.issuesIssuespagecontent.description" /></Label>
              <Textarea
                id="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="priority"><T k="auto.issuesIssuespagecontent.priority" /></Label>
              <Select
                value={newIssue.priority}
                onValueChange={(value) => setNewIssue({ ...newIssue, priority: value as IssuePriority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW"><T k="auto.issuesIssuespagecontent.low" /></SelectItem>
                  <SelectItem value="MEDIUM"><T k="auto.issuesIssuespagecontent.medium" /></SelectItem>
                  <SelectItem value="HIGH"><T k="auto.issuesIssuespagecontent.high" /></SelectItem>
                  <SelectItem value="CRITICAL"><T k="auto.issuesIssuespagecontent.critical" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="area"><T k="auto.issuesIssuespagecontent.area" /></Label>
              <Select
                value={newIssue.area}
                onValueChange={(value) => setNewIssue({ ...newIssue, area: value as IssueArea })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTENT"><T k="auto.issuesIssuespagecontent.content" /></SelectItem>
                  <SelectItem value="UI"><T k="auto.issuesIssuespagecontent.ui" /></SelectItem>
                  <SelectItem value="BUG"><T k="auto.issuesIssuespagecontent.bug" /></SelectItem>
                  <SelectItem value="FEATURE"><T k="auto.issuesIssuespagecontent.feature" /></SelectItem>
                  <SelectItem value="OTHER"><T k="auto.issuesIssuespagecontent.other" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="questionId"><T k="auto.issuesIssuespagecontent.relatedQuestionIdOptional" /></Label>
              <Input
                id="questionId"
                value={newIssue.questionId || ''}
                onChange={(e) => setNewIssue({ ...newIssue, questionId: e.target.value || null })}
                placeholder="Enter related question ID if applicable"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateIssue} className="min-h-11"><T k="auto.issuesIssuespagecontent.createCase" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="paper-sheet">
          <DialogHeader>
            <DialogTitle className="type-display"><T k="auto.issuesIssuespagecontent.filterCases" /></DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label><T k="auto.issuesIssuespagecontent.status" /></Label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="all"><T k="auto.issuesIssuespagecontent.all" /></TabsTrigger>
                  <TabsTrigger value="open"><T k="auto.issuesIssuespagecontent.open" /></TabsTrigger>
                  <TabsTrigger value="in_progress"><T k="auto.issuesIssuespagecontent.inProgress" /></TabsTrigger>
                  <TabsTrigger value="resolved"><T k="auto.issuesIssuespagecontent.resolved" /></TabsTrigger>
                  <TabsTrigger value="closed"><T k="auto.issuesIssuespagecontent.closed" /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label><T k="auto.issuesIssuespagecontent.priority" /></Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><T k="auto.issuesIssuespagecontent.allPriorities" /></SelectItem>
                  <SelectItem value="low"><T k="auto.issuesIssuespagecontent.low" /></SelectItem>
                  <SelectItem value="medium"><T k="auto.issuesIssuespagecontent.medium" /></SelectItem>
                  <SelectItem value="high"><T k="auto.issuesIssuespagecontent.high" /></SelectItem>
                  <SelectItem value="critical"><T k="auto.issuesIssuespagecontent.critical" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label><T k="auto.issuesIssuespagecontent.area" /></Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><T k="auto.issuesIssuespagecontent.allAreas" /></SelectItem>
                  <SelectItem value="content"><T k="auto.issuesIssuespagecontent.content" /></SelectItem>
                  <SelectItem value="ui"><T k="auto.issuesIssuespagecontent.ui" /></SelectItem>
                  <SelectItem value="bug"><T k="auto.issuesIssuespagecontent.bug" /></SelectItem>
                  <SelectItem value="feature"><T k="auto.issuesIssuespagecontent.feature" /></SelectItem>
                  <SelectItem value="other"><T k="auto.issuesIssuespagecontent.other" /></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsFilterDialogOpen(false)} className="min-h-11"><T k="auto.issuesIssuespagecontent.applyFilters" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
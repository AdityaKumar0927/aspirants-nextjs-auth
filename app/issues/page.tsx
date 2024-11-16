import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
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
import { RefreshCw, Search } from 'lucide-react'

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

async function getIssues(): Promise<Issue[]> {
  const issues = await prisma.issue.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return issues
}

async function getUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { role: true },
  })

  return user?.role?.name ?? null
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const issues = await getIssues()
  const userRole = await getUserRole()

  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : ''
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'All'
  const priorityFilter = typeof searchParams.priority === 'string' ? searchParams.priority : 'All'
  const areaFilter = typeof searchParams.area === 'string' ? searchParams.area : 'All'

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || issue.status === statusFilter
    const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter
    const matchesArea = areaFilter === "All" || issue.area === areaFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesArea
  })

  const canCreateIssue = userRole && userRole !== 'member'

  if (!userRole) {
    notFound()
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
                name="search"
                defaultValue={searchQuery}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select name="status" defaultValue={statusFilter}>
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
            <Select name="priority" defaultValue={priorityFilter}>
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
            <Select name="area" defaultValue={areaFilter}>
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
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreateIssue && (
            <Button size="sm">
              Create New Issue
            </Button>
          )}
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
                      {issue.createdAt.toLocaleString("en-US", {
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
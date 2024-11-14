"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

interface Issue {
  id: string
  title: string
  description: string
  status: Status
  createdAt: string
  updatedAt: string
  reporterName: string
}

export default function AdminDashboard() {
  const [issues, setIssues] = useState<Issue[]>([])
  const { toast } = useToast()

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch('/api/issues')
      if (!response.ok) throw new Error('Failed to fetch issues')
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch issues. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const handleStatusUpdate = useCallback(async (id: string, status: Status) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update issue status')

      toast({
        title: "Success",
        description: `Issue status updated to ${status}.`,
      })

      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === id ? { ...issue, status } : issue
        )
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update issue status.",
        variant: "destructive",
      })
    }
  }, [toast])

  const totalIssues = issues.length
  const resolvedIssues = useMemo(() => issues.filter((issue) => issue.status === 'RESOLVED').length, [issues])
  const openIssues = useMemo(() => issues.filter((issue) => issue.status === 'OPEN').length, [issues])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">-10% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIssues}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 days</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Recent Issues</h2>
        <Select defaultValue="last_week">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_week">Last week</SelectItem>
            <SelectItem value="last_two">Last two weeks</SelectItem>
            <SelectItem value="last_month">Last month</SelectItem>
            <SelectItem value="last_quarter">Last quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue number</TableHead>
              <TableHead>Reported date</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.id}</TableCell>
                <TableCell>{new Date(issue.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{issue.reporterName}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={issue.status}
                    onValueChange={(value) => handleStatusUpdate(issue.id, value as Status)}
                    disabled={issue.status === 'CLOSED'}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleStatusUpdate(issue.id, 'CLOSED')}
                    disabled={issue.status === 'CLOSED'}
                  >
                    Close
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
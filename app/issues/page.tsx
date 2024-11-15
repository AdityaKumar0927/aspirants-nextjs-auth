import { Suspense } from 'react'
import IssuesPageContent from './IssuesPageContent'
import prisma from '@/lib/prisma'

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

async function getInitialIssues(): Promise<Issue[]> {
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

  return issues.map(issue => ({
    ...issue,
    area: issue.area as IssueArea,
    status: issue.status as IssueStatus,
    priority: issue.priority as IssuePriority,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  }))
}

export default async function IssuesPage() {
  const initialIssues = await getInitialIssues()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IssuesPageContent initialIssues={initialIssues} />
    </Suspense>
  )
}
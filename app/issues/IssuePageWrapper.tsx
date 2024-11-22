import { Suspense } from 'react'
import IssuesPageContent from './IssuesPageContent'
import { Skeleton } from "@/components/ui/skeleton"

async function getIssues() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/issues`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch issues')
  }
  return res.json()
}

export default async function IssuePageWrapper() {
  const initialIssues = await getIssues()

  return (
    <Suspense fallback={<IssuesPageSkeleton />}>
      <IssuesPageContent initialIssues={initialIssues} />
    </Suspense>
  )
}

function IssuesPageSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
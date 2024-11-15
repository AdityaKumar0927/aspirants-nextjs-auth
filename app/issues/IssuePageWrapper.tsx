import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import IssuesPage, { IssuesPageProps } from './IssuesPageContent'
import { Skeleton } from "@/components/ui/skeleton"

async function getInitialIssues() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issues`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch issues')
  }
  return response.json()
}

export default async function IssuesPageWrapper() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role?.name || 'member'
  const initialIssues = await getInitialIssues()

  const props: IssuesPageProps = {
    userRole,
    initialIssues
  }

  return (
    <Suspense fallback={<IssuesPageSkeleton />}>
      <IssuesPage {...props} />
    </Suspense>
  )
}

function IssuesPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}
import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import IssuesPage from './page'
import { Skeleton } from "@/components/ui/skeleton"

export default async function IssuesPageWrapper() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role?.name || 'member'

  return (
    <Suspense fallback={<IssuesPageSkeleton />}>
      <IssuesPage userRole={userRole} />
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
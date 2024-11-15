import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import { ProfileForm } from './profile-form'
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from 'next/navigation'

export default async function ProfilePageWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = session.user?.role?.name || 'member'

  return (
    <Suspense fallback={<ProfileFormSkeleton />}>
      <ProfileForm initialData={await fetchProfileData(session.user.id)} userRole={userRole} />
    </Suspense>
  )
}

async function fetchProfileData(userId: string) {
  // Fetch profile data from your API
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${userId}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch profile data')
  }
  return response.json()
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-[120px]" />
    </div>
  )
}
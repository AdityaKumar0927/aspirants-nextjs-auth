import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import ProfileForm from './profile-form'
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from 'next/navigation'
import prisma from "@/lib/prisma"

export default async function ProfileFormWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id
  const userRole = session.user?.role?.name || 'member'

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: userId },
  })

  if (!userSettings) {
    // Handle the case where user settings don't exist
    // You might want to create default settings here
    return <div>Error: User settings not found</div>
  }

  const initialData = {
    id: userSettings.id,
    username: userSettings.username,
    email: userSettings.email,
    bio: userSettings.bio,
    urls: userSettings.urls as { value: string }[],
    name: userSettings.name,
    language: userSettings.language,
  }

  return (
    <Suspense fallback={<ProfileFormSkeleton />}>
      <ProfileForm 
        userId={userId}
        initialData={initialData} 
        userRole={userRole} 
      />
    </Suspense>
  )
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
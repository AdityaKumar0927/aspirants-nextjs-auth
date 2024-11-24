import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import ApplicationForm from './ApplicationForm'

export default async function ApplyPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/apply')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl flex justify-center font-light mb-4">Volunteer/Moderator Application</h1>
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ApplicationForm session={session} />
      </Suspense>
    </div>
  )
}
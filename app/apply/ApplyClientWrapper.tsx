'use client'

import { useSession } from 'next-auth/react'
import { useSignInModal } from '@/components/layout/sign-in'
import ApplicationForm from './ApplicationForm'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ApplyClientWrapper() {
  const { data: session, status } = useSession()
  const { SignInModal, setShowSignInModal } = useSignInModal()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowSignInModal(true)
    }
  }, [status, setShowSignInModal])

  if (status === 'loading') {
    return <Loader2 className="mx-auto h-8 w-8 animate-spin text-ballpoint" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Alert>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <SignInModal />
        <p>Please sign in to submit an application.</p>
        <Button className="mt-4" onClick={() => setShowSignInModal(true)}>
          Sign In
        </Button>
      </>
    )
  }

  if (!session || !session.user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Session data is missing or invalid. Please try signing in again.</AlertDescription>
        <Button className="mt-4" onClick={() => setShowSignInModal(true)}>
          Sign In Again
        </Button>
      </Alert>
    )
  }

  return (
    <>
      <SignInModal />
      <ApplicationForm session={session} />
    </>
  )
}
"use client"

import { useSession } from 'next-auth/react'
import { useSignInModal } from '@/components/layout/sign-in'
import ApplicationForm from './ApplicationForm'
import { Loader2 } from 'lucide-react'

export default function ApplyClientWrapper() {
  const { data: session, status } = useSession()
  const { SignInModal, setShowSignInModal } = useSignInModal()

  if (status === 'loading') {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  if (status === 'unauthenticated') {
    setShowSignInModal(true)
    return (
      <>
        <SignInModal />
        <p>Please sign in to submit an application.</p>
      </>
    )
  }

  return (
    <>
      <SignInModal />
      <ApplicationForm session={session} />
    </>
  )
}
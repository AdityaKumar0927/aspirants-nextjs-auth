"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Google } from "@/components/shared/icons"
import Modal2 from "@/components/layout/modal-2"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

type LoadingState = {
  text: string
}

const loadingStates: LoadingState[] = [
  { text: "Initiating sign-in process" },
  { text: "Verifying credentials" },
  { text: "Checking account status" },
  { text: "Setting up your session" },
  { text: "Almost there!" },
]

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[]
  value?: number
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value)
        const opacity = Math.max(1 - distance * 0.2, 0)

        return (
          <motion.div
            key={index}
            className={cn("text-left flex gap-2 mb-4")}
            initial={{ opacity: 0, y: -(value * 40) }}
            animate={{ opacity: opacity, y: -(value * 40) }}
            transition={{ duration: 0.5 }}
          >
            <div>
              {index > value && (
                <CheckIcon className="text-black dark:text-white" />
              )}
              {index <= value && (
                <CheckFilled
                  className={cn(
                    "text-black dark:text-white",
                    value === index &&
                      "text-black dark:text-lime-500 opacity-100"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "text-black dark:text-white",
                value === index && "text-black dark:text-lime-500 opacity-100"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
}: {
  loadingStates: LoadingState[]
  loading?: boolean
  duration?: number
  loop?: boolean
}) => {
  const [currentState, setCurrentState] = useState(0)

  useEffect(() => {
    if (!loading) {
      setCurrentState(0)
      return
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      )
    }, duration)

    return () => clearTimeout(timeout)
  }, [currentState, loading, loop, loadingStates.length, duration])

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl"
        >
          <div className="h-96 relative">
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>

          <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  const SignInModal = useCallback(() => {
    return (
      <SignInModalComponent
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
        showLoader={showLoader}
        setShowLoader={setShowLoader}
      />
    )
  }, [showSignInModal, setShowSignInModal, showLoader, setShowLoader])

  return useMemo(
    () => ({ setShowSignInModal, SignInModal }),
    [setShowSignInModal, SignInModal]
  )
}

function SignInModalComponent({
  showSignInModal,
  setShowSignInModal,
  showLoader,
  setShowLoader,
}: {
  showSignInModal: boolean
  setShowSignInModal: React.Dispatch<React.SetStateAction<boolean>>
  showLoader: boolean
  setShowLoader: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async (provider: string) => {
    setShowSignInModal(false)
    setShowLoader(true)

    const startTime = Date.now()
    const minDuration = 5000 // Minimum duration for the loader to be visible

    try {
      const [signInResult] = await Promise.all([
        signIn(provider, { redirect: false }),
        new Promise(resolve => setTimeout(resolve, minDuration))
      ])

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      // Ensure the loader stays visible for at least the minimum duration
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime))
      }

      router.push('/dashboard') // Redirect to dashboard after successful sign-in
    } catch (error) {
      console.error('Sign-in error:', error)
      toast({
        title: 'Sign-in Error',
        description: 'An error occurred during sign-in. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setShowLoader(false)
    }
  }

  return (
    <>
      <Modal2
        showModal={showSignInModal}
        setShowModal={setShowSignInModal}
        className="p-0"
      >
        <div className="relative h-full w-full">
          <button
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={() => setShowSignInModal(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">Sign In</h2>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => handleSignIn('google')}
              >
                <Google className="w-4 h-4 mr-2" />
                Sign in with Google
              </Button>
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{' '}
                <a href="/terms-of-service" className="underline">
                  Terms of Service
                </a>
                ,{' '}
                <a href="/privacy-policy" className="underline">
                  Privacy Policy
                </a>
                {' '}
                and 
                {' '}
                <a href="/cookie-policy" className="underline">
                  Cookie Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Modal2>

      <MultiStepLoader loadingStates={loadingStates} loading={showLoader} duration={1000} loop={false} />
    </>
  )
}

export default SignInModalComponent
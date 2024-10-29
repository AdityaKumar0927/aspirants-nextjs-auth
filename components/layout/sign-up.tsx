'use client'

import { useState, useCallback, useMemo } from "react"
import Modal2 from "@/components/layout/modal-2"
import LoginForm from "@/components/new-ui/login-form"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function useSignUpModal() {
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  const SignUpModal = useCallback(() => {
    return (
      <SignUpModalComponent
        showSignUpModal={showSignUpModal}
        setShowSignUpModal={setShowSignUpModal}
      />
    )
  }, [showSignUpModal, setShowSignUpModal])

  return useMemo(
    () => ({ setShowSignUpModal, SignUpModal }),
    [setShowSignUpModal, SignUpModal]
  )
}

function SignUpModalComponent({
  showSignUpModal,
  setShowSignUpModal,
}: {
  showSignUpModal: boolean
  setShowSignUpModal: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [skipSetup, setSkipSetup] = useState(false)

  const handleSkipSetup = () => {
    setSkipSetup(true)
  }

  return (
    <Modal2
      showModal={showSignUpModal}
      setShowModal={setShowSignUpModal}
      className="p-0"
    >
      <div className="relative h-full w-full">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none"
          onClick={() => setShowSignUpModal(false)}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex h-full items-center justify-center">
          <LoginForm isSignUp={true} skipSetup={skipSetup} />
        </div>
        {!skipSetup && (
          <Button
            onClick={handleSkipSetup}
            className="absolute bottom-4 right-4"
          >
            Skip Setup
          </Button>
        )}
      </div>
    </Modal2>
  )
}

export default SignUpModalComponent;
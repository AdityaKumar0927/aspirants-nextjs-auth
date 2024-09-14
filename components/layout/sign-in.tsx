// components/layout/sign-in.tsx

import { useState, useCallback, useMemo } from "react";
import Modal2 from "@/components/layout/modal-2";
import LoginForm from "../new-ui/login-form";
import { X } from "lucide-react";

// Hook to manage the sign-in modal state
export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const SignInModal = useCallback(() => {
    return (
      <SignInModalComponent
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    );
  }, [showSignInModal, setShowSignInModal]);

  return useMemo(
    () => ({ setShowSignInModal, SignInModal }),
    [setShowSignInModal, SignInModal]
  );
}

// The sign-in modal component
function SignInModalComponent({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Modal2
      showModal={showSignInModal}
      setShowModal={setShowSignInModal}
      className="p-0" // Adjusted className if needed
    >
      <div className="relative h-full w-full">
        {/* Close button at the top right */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none"
          onClick={() => setShowSignInModal(false)}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        {/* Centered login form */}
        <div className="flex h-full items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </Modal2>
  );
}

export default SignInModalComponent;

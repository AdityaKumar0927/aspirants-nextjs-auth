// components/layout/sign-up.tsx

import { useState, useCallback, useMemo } from "react";
import Modal2 from "@/components/layout/modal-2"; // Adjust the path if necessary
import SignUpForm from "../new-ui/sign-up-form"; // Adjust the path if necessary
import { X } from "lucide-react"; // Icon for the close button

// Hook to manage the sign-up modal state
export function useSignUpModal() {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const SignUpModal = useCallback(() => {
    return (
      <SignUpModalComponent
        showSignUpModal={showSignUpModal}
        setShowSignUpModal={setShowSignUpModal}
      />
    );
  }, [showSignUpModal, setShowSignUpModal]);

  return useMemo(
    () => ({ setShowSignUpModal, SignUpModal }),
    [setShowSignUpModal, SignUpModal]
  );
}

// The sign-up modal component
function SignUpModalComponent({
  showSignUpModal,
  setShowSignUpModal,
}: {
  showSignUpModal: boolean;
  setShowSignUpModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Modal2
      showModal={showSignUpModal}
      setShowModal={setShowSignUpModal}
      className="p-0"
    >
      <div className="relative h-full w-full">
        {/* Close button at the top right */}
        <button
          className="absolute top-4 right-4 text-black"
          onClick={() => setShowSignUpModal(false)}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        {/* Centered sign-up form */}
        <div className="flex h-full items-center justify-center">
          <SignUpForm />
        </div>
      </div>
    </Modal2>
  );
}

export default SignUpModalComponent;

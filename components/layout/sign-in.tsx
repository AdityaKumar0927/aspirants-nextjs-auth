import { useState, useCallback, useMemo } from "react";
import Modal2 from "@/components/layout/modal-2";
import { X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn('google', { callbackUrl: '/' });
      if (result?.error) {
        throw new Error(result.error);
      }
      // Close the modal on successful sign-in
      setShowSignInModal(false);
    } catch (error) {
      console.error('Sign-in error:', error);
      toast({
        title: 'Sign-in Error',
        description: 'An error occurred during sign-in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <Button onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </div>
        </div>
      </div>
    </Modal2>
  );
}

export default SignInModalComponent;
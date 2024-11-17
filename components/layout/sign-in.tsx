import { useState, useCallback, useMemo } from "react";
import Modal2 from "@/components/layout/modal-2";
import { X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Google } from "@/components/shared/icons";

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

function SignInModalComponent({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      const result = await signIn(provider, { callbackUrl: '/' });
      if (result?.error) {
        throw new Error(result.error);
      }
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
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm mr-2"></span>
              ) : (
                <Google className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="/terms-of-service" className="underline">
                Terms of Service
              </a>{' '}
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
  );
}

export default SignInModalComponent;
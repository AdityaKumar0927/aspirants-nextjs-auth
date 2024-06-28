import Modal from "@/components/shared/modal";
import { signIn } from "next-auth/react";
import { useState, Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { LoadingDots, Google } from "@/components/shared/icons";
import Image from "next/image";
import Link from "next/link";

const SignInModal = ({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean;
  setShowSignInModal: Dispatch<SetStateAction<boolean>>;
}) => {
  const [signInClicked, setSignInClicked] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);

  const canSignIn = acceptedTerms && acceptedPrivacy && acceptedCookies;

  return (
    <Modal showModal={showSignInModal} setShowModal={setShowSignInModal}>
      <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
          <a href="https://aspirants.tech">
            <Image
              src="/bulb.svg"
              alt="Logo"
              className="h-10 w-10 rounded-full"
              width={20}
              height={20}
            />
          </a>
          <h3 className="font-display text-2xl font-bold">Sign In</h3>
          <p className="text-sm text-gray-500">
            This is strictly for demo purposes - only your email and profile
            picture will be stored.
          </p>
        </div>

        <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={acceptedTerms}
              onChange={() => setAcceptedTerms(!acceptedTerms)}
            />
            <span className="text-sm text-gray-600">
              I have read and accept the{" "}
              <Link href="#" onClick={() => { /* open terms modal */ }} className="text-blue-600 underline">
                Terms of Service
              </Link>
            </span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={acceptedPrivacy}
              onChange={() => setAcceptedPrivacy(!acceptedPrivacy)}
            />
            <span className="text-sm text-gray-600">
              I have read and accept the{" "}
              <Link href="#" onClick={() => { /* open privacy modal */ }} className="text-blue-600 underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={acceptedCookies}
              onChange={() => setAcceptedCookies(!acceptedCookies)}
            />
            <span className="text-sm text-gray-600">
              I have read and accept the{" "}
              <Link href="#" onClick={() => { /* open cookies modal */ }} className="text-blue-600 underline">
                Cookie Policy
              </Link>
            </span>
          </label>

          <button
            disabled={signInClicked || !canSignIn}
            className={`${
              signInClicked || !canSignIn
                ? "cursor-not-allowed border-gray-200 bg-gray-100"
                : "border border-gray-200 bg-white text-black hover:bg-gray-50"
            } flex h-10 w-full items-center justify-center space-x-3 rounded-md border text-sm shadow-sm transition-all duration-75 focus:outline-none`}
            onClick={() => {
              setSignInClicked(true);
              signIn("google");
            }}
          >
            {signInClicked ? (
              <LoadingDots color="#808080" />
            ) : (
              <>
                <Google className="h-5 w-5" />
                <p>Sign In with Google</p>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const SignInModalCallback = useCallback(() => {
    return (
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    );
  }, [showSignInModal, setShowSignInModal]);

  return useMemo(
    () => ({ setShowSignInModal, SignInModal: SignInModalCallback }),
    [setShowSignInModal, SignInModalCallback],
  );
}

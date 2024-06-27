"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSignInModal } from "./sign-in-modal";
import UserDropdown from "./user-dropdown";
import NotificationDropdown from "@/components/shared/NotificationDropdown";
import { Session } from "next-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import useScroll from "@/lib/hooks/use-scroll";

export default function NavBar({ session }: { session: Session | null }) {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const scrolled = useScroll(50);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <SignInModal />
      <div
        className={`fixed top-0 w-full flex justify-center ${
          scrolled
            ? "border-b border-gray-200 bg-white/50 backdrop-blur-xl"
            : "bg-white/0"
        } z-30 transition-all`}
      >
        <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between w-full">
          <Link href="/" className="flex items-center font-display text-2xl">
            <p>aspirants</p>
            <Image
              src="/bulb.svg"
              alt="aspirants logo"
              width="30"
              height="30"
              className="mr-2 mx-3 rounded-sm"
            />
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/QuestionBank" className="mr-4">Question Bank</Link>
            {session ? (
              <>
                <NotificationDropdown />
                <UserDropdown session={session} />
              </>
            ) : (
              <button
                className="rounded-full border border-black bg-white p-1.5 px-4 text-sm text-black transition-all hover:bg-black hover:text-white"
                onClick={() => setShowSignInModal(true)}
              >
                Sign In
              </button>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-black focus:outline-none">
              <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} size="lg" />
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 bottom-0 bg-white flex flex-col items-center justify-center z-40 px-4">
          <button onClick={toggleMenu} className="absolute top-4 right-4 text-black focus:outline-none">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
          <Link href="/" className="mb-4 text-2xl" onClick={toggleMenu}>
            Home
          </Link>
          <Link href="/QuestionBank" className="mb-4 text-2xl" onClick={toggleMenu}>
            Question Bank
          </Link>
          {session ? (
            <div className="w-full">
              <NotificationDropdown />
              <UserDropdown session={session} />
            </div>
          ) : (
            <button
              className="rounded-full border border-black bg-white p-1.5 px-4 text-sm text-black transition-all hover:bg-black hover:text-white mb-4"
              onClick={() => {
                setShowSignInModal(true);
                toggleMenu();
              }}
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </>
  );
}

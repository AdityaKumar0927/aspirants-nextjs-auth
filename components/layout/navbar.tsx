"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSignInModal } from "./sign-in-modal";
import UserDropdown from "./user-dropdown";
import NotificationDropdown from "@/components/shared/NotificationDropdown";
import { Session } from "next-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import useScroll from "@/lib/hooks/use-scroll";
import ExamDropdown from "@/components/layout/ExamDropdown";

export default function NavBar({ session }: { session: Session | null }) {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const scrolled = useScroll(50);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <SignInModal />
      <div
        className={`fixed top-0 w-full flex justify-center ${
          scrolled
            ? "border-b border-gray-200 bg-white/50 backdrop-blur-md"
            : "bg-white/0"
        } z-30 transition-all`}
      >
        <div className="mx-5 flex h-16 max-w-screen-xl items-center justify-between w-full">
          <Link href="/" className="flex items-center font-display text-2xl">
            <p className="text-left font-display text-2xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
              aspirants
            </p>
            <Image
              src="/bulb.svg"
              alt="aspirants logo"
              width="30"
              height="30"
              className="mr-2 mx-3 rounded-sm"
            />
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <ExamDropdown />
            <Link href="/BrowseResources" className="mr-4">
              Browse Resources
            </Link>
            <Link href="/Planner" className="mr-4">
              Planner
            </Link>
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
        <>
          <div className="fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-blur-sm"></div>
          <div className="fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-md flex flex-col items-center justify-center p-4 space-y-4 shadow-lg rounded-lg">
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 text-black focus:outline-none"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
            <ExamDropdown className="font-display text-2xl font-bold tracking-tight drop-shadow-sm" />
            <Link href="/BrowseResources" onClick={toggleMenu}>
              <p className="text-center font-display text-2xl font-bold tracking-tight drop-shadow-sm">
                Browse Resources
              </p>
            </Link>
            <Link href="/Planner" onClick={toggleMenu}>
              <p className="text-center font-display text-2xl font-bold tracking-tight drop-shadow-sm">
                Planner
              </p>
            </Link>
            {session ? (
              <UserDropdown session={session} />
            ) : (
              <button
                className="rounded-full border border-black bg-white p-1.5 px-4 text-lg text-black transition-all hover:bg-black hover:text-white"
                onClick={() => {
                  setShowSignInModal(true);
                  toggleMenu();
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

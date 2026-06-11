"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import ShimmerButton from "@/components/magicui/shimmer-button";

export default function TryNowButton() {
  const { data: session } = useSession();

  // If user is already signed in, hide/return nothing
  if (session) {
    return null;
  }

  // Otherwise, render the button for guests
  return (
    <Link 
      className="group flex max-w-fit items-center" 
      href="/question-bank/guest"
    >
      <ShimmerButton className="shadow-2xl">
        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:text-white lg:text-lg">
          Try Now
        </span>
      </ShimmerButton>
    </Link>
  );
}

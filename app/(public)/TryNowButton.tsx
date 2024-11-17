'use client';

import { useSession } from "next-auth/react";
import Link from 'next/link';
import ShimmerButton from '@/components/magicui/shimmer-button';

export default function TryNowButton() {
  const { data: session } = useSession();

  return (
    <Link 
      className="group flex max-w-fit items-center" 
      href={session ? "/QuestionBank" : "/QuestionBank/guest"}
    >
      <ShimmerButton className="shadow-2xl">
        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
          Try Now
        </span>
      </ShimmerButton>
    </Link>
  );
}
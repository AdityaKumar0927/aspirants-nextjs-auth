"use client";

import { signOut } from "next-auth/react";

export default function SuspendedActions() {
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex min-h-11 items-center rounded-md border border-rule px-4 text-sm font-medium text-pencil transition-colors hover:bg-secondary hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
}

"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client wrapper around NextAuth's SessionProvider so server layouts can
 * give their client subtrees access to useSession()/update() — needed by the
 * onboarding flow (to release the gate) and the consent UI.
 */
export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}

"use client";

import { type ComponentProps } from "react";
import { SessionProvider } from "next-auth/react";
import ProfileForm from "./profile-form";

/**
 * Provides the NextAuth session context the profile form needs: withdrawing a
 * mandatory policy calls `useSession().update()` to force the onboarding gate to
 * re-fire. The /forms layout mounts ComplianceProviders as a sibling of the page
 * (not a wrapper), so the form supplies its own SessionProvider here.
 */
export default function ProfileFormSession(props: ComponentProps<typeof ProfileForm>) {
  return (
    <SessionProvider>
      <ProfileForm {...props} />
    </SessionProvider>
  );
}

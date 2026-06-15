import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      /** DPDP onboarding gate flags (mirrored from the JWT). */
      onboardingComplete?: boolean;
      isMinor?: boolean;
      parentalConsentOk?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    /** epoch ms of the last DB role re-sync (drives periodic refresh) */
    roleSyncedAt?: number;
    /** DPDP onboarding gate flags, re-synced from the DB like `role`. */
    onboardingComplete?: boolean;
    isMinor?: boolean;
    /** true when a minor has VERIFIED parental consent (always true for adults). */
    parentalConsentOk?: boolean;
    /** epoch ms of the last DB onboarding re-sync. */
    onboardingSyncedAt?: number;
  }
}

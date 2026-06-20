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
      /**
       * Set ONLY on an impersonation overlay (lib/auth.ts getCurrentSession):
       * the userId of the real admin acting as this user. Privileged guards
       * refuse to act while this is present.
       */
      impersonatedBy?: string;
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
    /** epoch ms this session was minted (drives the force-logout epoch check). */
    loginAt?: number;
    /** epoch ms of the last activity (drives the idle-timeout check). */
    lastActiveAt?: number;
    /** epoch ms of the last AppConfig (security controls) re-sync. */
    controlSyncedAt?: number;
    /** mirrored AppConfig.sessionsValidFrom in epoch ms (0 = unset). */
    sessionsValidFromMs?: number;
    /** mirrored idle timeout in ms (0 = disabled). */
    idleTimeoutMs?: number;
  }
}

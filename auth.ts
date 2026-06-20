import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import authConfig from "@/auth.config"
import { getAppConfig, isEmailDomainBlocked } from "@/lib/app-config"

/**
 * Full (Node-runtime) Auth.js configuration. Extends the edge-safe auth.config
 * with everything that needs Prisma: the adapter, the dev-login provider, the
 * jwt() role/onboarding re-sync, the signIn() user bootstrap, and audit events.
 *
 * Exposes { handlers, auth, signIn, signOut }:
 *  - handlers -> the /api/auth/[...nextauth] route,
 *  - auth     -> server-side session reader (replaces getServerSession),
 *  - signIn/signOut -> server actions.
 */

/**
 * Dev-only sign-in for local machines without Google OAuth credentials.
 * DOUBLE-GATED: registered only when NODE_ENV !== "production" AND DEV_LOGIN=1
 * is explicitly set — it can never activate on a production deploy. Signs in as
 * an EXISTING user by email (never creates accounts).
 */
const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "1"

/**
 * Copies the DPDP onboarding-gate flags from the DB user onto the JWT so the
 * edge middleware can gate access without touching the database. Adults always
 * have parentalConsentOk=true; minors only once their ParentalConsent is VERIFIED.
 */
function stampOnboarding(
  token: JWT,
  dbUser: {
    onboardingComplete: boolean
    isMinor: boolean | null
    ParentalConsent: { status: string } | null
  }
) {
  const isMinor = dbUser.isMinor === true
  token.onboardingComplete = dbUser.onboardingComplete
  token.isMinor = isMinor
  token.parentalConsentOk = isMinor
    ? dbUser.ParentalConsent?.status === "VERIFIED"
    : true
}

/** Strip all identity claims — turns the token effectively signed-out. Used when
 * the DB user is gone, the force-logout epoch invalidates the session, or it
 * idles out. Downstream guards treat the absent role as a non-admin nobody. */
function clearIdentity(token: JWT) {
  token.id = undefined
  token.role = undefined
  token.onboardingComplete = undefined
  token.isMinor = undefined
  token.parentalConsentOk = undefined
}

/** Mirror the AppConfig security controls (force-logout epoch + idle timeout)
 * onto the token so the per-request check needs no DB read. Fails soft. */
async function syncSecurityControls(token: JWT, now: number) {
  try {
    const cfg = await getAppConfig()
    token.sessionsValidFromMs = cfg.sessionsValidFrom ? cfg.sessionsValidFrom.getTime() : 0
    token.idleTimeoutMs = cfg.sessionTimeoutMin > 0 ? cfg.sessionTimeoutMin * 60_000 : 0
  } catch {
    token.sessionsValidFromMs = token.sessionsValidFromMs ?? 0
    token.idleTimeoutMs = token.idleTimeoutMs ?? 0
  }
  token.controlSyncedAt = now
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login (local only)",
            credentials: {
              email: { label: "Email of an existing user", type: "email" },
            },
            async authorize(credentials) {
              if (!devLoginEnabled) return null
              const email =
                typeof credentials?.email === "string"
                  ? credentials.email.trim().toLowerCase()
                  : ""
              if (!email) return null
              const user = await prisma.user.findUnique({ where: { email } })
              if (!user) return null
              return { id: user.id, name: user.name, email: user.email, image: user.image }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // (A) signIn(): bootstrap the User row + a default "member" role on first
    // sign-in, mirroring the previous behaviour (the adapter links the Google
    // account to this email).
    async signIn({ user, account }) {
      if (!user.email) return false
      try {
        const config = await getAppConfig()
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true },
        })

        if (!existingUser) {
          // --- Abuse controls, applied to NEW sign-ups only (so an admin can't
          // accidentally lock out established users by tightening these). ---

          // Registration kill switch — flip off during an abuse wave / botched launch.
          if (!config.registrationOpen) {
            await logAudit({
              action: "SIGNUP_BLOCKED",
              metadata: { reason: "registration-closed", email: user.email },
            })
            return false
          }
          // Email-domain blocklist (disposable-email floods).
          if (isEmailDomainBlocked(user.email, config)) {
            await logAudit({
              action: "SIGNUP_BLOCKED",
              metadata: { reason: "domain-blocklist", email: user.email },
            })
            return false
          }
          // Require a provider that asserts a verified email (Google does;
          // dev-login does not). Only meaningful for non-Google providers.
          if (
            config.requireEmailVerification &&
            account?.provider &&
            account.provider !== "google"
          ) {
            await logAudit({
              action: "SIGNUP_BLOCKED",
              metadata: { reason: "email-unverified", email: user.email },
            })
            return false
          }
          // Global signup throttle: a brake on mass account creation. The OAuth
          // signIn callback has no request IP, so this is a GLOBAL window (total
          // new accounts), which is exactly what stops a registration flood.
          if (config.signupThrottleLimit > 0) {
            const since = new Date(Date.now() - config.signupThrottleWindowSec * 1000)
            const recent = await prisma.user.count({ where: { createdAt: { gt: since } } })
            if (recent >= config.signupThrottleLimit) {
              await logAudit({
                action: "SIGNUP_BLOCKED",
                metadata: { reason: "signup-throttle", email: user.email },
              })
              return false
            }
          }

          const memberRole = await prisma.userRole.upsert({
            where: { name: "member" },
            update: {},
            create: { name: "member", permissions: {} },
          })
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              roleId: memberRole.id,
            },
          })
        } else if (!existingUser.UserRole) {
          const memberRole = await prisma.userRole.upsert({
            where: { name: "member" },
            update: {},
            create: { name: "member", permissions: {} },
          })
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { roleId: memberRole.id },
          })
        }
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },

    // (B) jwt(): stamp id/role/onboarding on sign-in, then re-sync from the DB
    // when stale or on an explicit update(), so a revoked role / suspension /
    // verified parental consent reflects within ROLE_TTL_MS in the edge gate.
    // Also enforces the admin "force-logout all" epoch and the idle-timeout.
    async jwt({ token, user, trigger }) {
      const ROLE_TTL_MS = 60 * 1000
      const now = Date.now()

      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true, ParentalConsent: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.UserRole?.name ?? "member"
          token.roleSyncedAt = now
          stampOnboarding(token, dbUser)
        }
        // Session lifecycle markers for the force-logout / idle-timeout checks.
        token.loginAt = now
        token.lastActiveAt = now
        await syncSecurityControls(token, now)
        return token
      }

      const stale =
        !token.roleSyncedAt || now - token.roleSyncedAt > ROLE_TTL_MS
      if (token.id && (trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { UserRole: true, ParentalConsent: true },
        })
        if (dbUser) {
          token.role = dbUser.UserRole?.name ?? "member"
          stampOnboarding(token, dbUser)
        } else {
          clearIdentity(token)
        }
        token.roleSyncedAt = now
        token.onboardingSyncedAt = now
      }

      // Re-sync the security controls (force-logout epoch + idle timeout) on the
      // same low-frequency window, then enforce them locally on every request.
      const controlStale =
        !token.controlSyncedAt || now - token.controlSyncedAt > ROLE_TTL_MS
      if (token.id && (trigger === "update" || controlStale)) {
        await syncSecurityControls(token, now)
      }
      if (token.id) {
        // Force-logout: any session minted before the epoch is invalidated. A
        // token with no recorded loginAt (minted before this code shipped)
        // counts as "before", so the first nuke clears legacy sessions too.
        if (token.sessionsValidFromMs && (token.loginAt ?? 0) < token.sessionsValidFromMs) {
          clearIdentity(token)
          return token
        }
        // Idle timeout.
        if (token.idleTimeoutMs && token.lastActiveAt && now - token.lastActiveAt > token.idleTimeoutMs) {
          clearIdentity(token)
          return token
        }
        token.lastActiveAt = now
      }
      return token
    },
  },

  // Best-effort auth-event audit trail (logAudit swallows its own errors).
  events: {
    async signIn({ user, account, isNewUser }) {
      await logAudit({
        userId: user.id,
        action: "SIGNED_IN",
        metadata: { provider: account?.provider, isNewUser: !!isNewUser },
      })
    },
    async signOut(message) {
      const userId =
        "token" in message ? (message.token?.id as string | undefined) : undefined
      await logAudit({ userId: userId ?? null, action: "SIGNED_OUT" })
    },
    async createUser({ user }) {
      await logAudit({ userId: user.id, action: "USER_CREATED" })
    },
  },

  debug: process.env.NODE_ENV === "development",
})

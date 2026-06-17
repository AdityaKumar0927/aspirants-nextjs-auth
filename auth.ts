import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import authConfig from "@/auth.config"

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
    async signIn({ user }) {
      if (!user.email) return false
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true },
        })

        if (!existingUser) {
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
    async jwt({ token, user, trigger }) {
      const ROLE_TTL_MS = 60 * 1000

      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true, ParentalConsent: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.UserRole?.name ?? "member"
          token.roleSyncedAt = Date.now()
          stampOnboarding(token, dbUser)
        }
        return token
      }

      const stale =
        !token.roleSyncedAt || Date.now() - token.roleSyncedAt > ROLE_TTL_MS
      if (token.id && (trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { UserRole: true, ParentalConsent: true },
        })
        if (dbUser) {
          token.role = dbUser.UserRole?.name ?? "member"
          stampOnboarding(token, dbUser)
        } else {
          token.id = undefined
          token.role = undefined
          token.onboardingComplete = undefined
          token.isMinor = undefined
          token.parentalConsentOk = undefined
        }
        token.roleSyncedAt = Date.now()
        token.onboardingSyncedAt = Date.now()
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

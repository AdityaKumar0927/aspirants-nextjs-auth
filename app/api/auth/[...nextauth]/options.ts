import { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

/**
 * Dev-only sign-in for local machines without Google OAuth credentials.
 * DOUBLE-GATED: registered only when NODE_ENV !== "production" AND DEV_LOGIN=1
 * is explicitly set in .env — it can never activate on a production deploy.
 * Signs in as an EXISTING user by email (never creates accounts). Anyone with
 * local shell access already holds the DB credentials in .env, so this grants
 * nothing they don't have.
 */
const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "1"

const devLoginProvider = CredentialsProvider({
  id: "dev-login",
  name: "Dev Login (local only)",
  credentials: {
    email: { label: "Email of an existing user", type: "email" },
  },
  async authorize(credentials) {
    if (!devLoginEnabled) return null
    const email = credentials?.email?.trim().toLowerCase()
    if (!email) return null
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email, image: user.image }
  },
})

/**
 * Copies the DPDP onboarding-gate flags from the DB user onto the JWT, so the
 * edge middleware can gate access without touching the database. Adults always
 * have parentalConsentOk=true; minors only once their ParentalConsent is
 * VERIFIED.
 */
function stampOnboarding(
  token: JWT,
  dbUser: { onboardingComplete: boolean; isMinor: boolean | null; ParentalConsent: { status: string } | null }
) {
  const isMinor = dbUser.isMinor === true
  token.onboardingComplete = dbUser.onboardingComplete
  token.isMinor = isMinor
  token.parentalConsentOk = isMinor
    ? dbUser.ParentalConsent?.status === "VERIFIED"
    : true
}

export const authOptions: NextAuthOptions = {
  // Connect Prisma + NextAuth
  adapter: PrismaAdapter(prisma),

  // OAuth Provider(s) — plus the gated dev login when enabled (see above).
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    ...(devLoginEnabled ? [devLoginProvider] : []),
  ],

  // Callbacks
  callbacks: {
    // ------------------------------------------------
    // (A) signIn() callback
    // ------------------------------------------------
    async signIn({ user }) {
      if (!user.email) return false

      try {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true }, // "UserRole" must match your schema field
        })

        if (!existingUser) {
          // 2. If no user, create a new user with "member" role
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
          // 3. If user exists but has no role, assign "member"
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

    // ------------------------------------------------
    // (B) jwt() callback
    //
    // The role is re-synced from the database periodically (and on an explicit
    // session update()), so a revoked admin loses access within ROLE_TTL_MS
    // instead of keeping it for the full token lifetime.
    // ------------------------------------------------
    async jwt({ token, user, trigger }) {
      const ROLE_TTL_MS = 5 * 60 * 1000

      // Initial sign-in: stamp id + role + DPDP onboarding flags from the
      // freshly linked user.
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

      // Subsequent requests: re-sync role + onboarding when stale or explicitly
      // refreshed (an `update()` call — e.g. right after finishing onboarding —
      // releases the gate immediately instead of waiting out the TTL).
      const stale =
        !token.roleSyncedAt || Date.now() - token.roleSyncedAt > ROLE_TTL_MS
      if (token.id && (trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { UserRole: true, ParentalConsent: true },
        })
        if (dbUser) {
          token.role = dbUser.UserRole?.name ?? "member"
          stampOnboarding(token, dbUser)
        } else {
          // User was deleted => invalidate the identity entirely, so
          // requireSession() (which checks user.id) rejects the stale token.
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

    // ------------------------------------------------
    // (C) session() callback
    // ------------------------------------------------
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.onboardingComplete = token.onboardingComplete ?? false
        session.user.isMinor = token.isMinor ?? false
        session.user.parentalConsentOk = token.parentalConsentOk ?? false
      }
      return session
    },
  },

  // No `pages` config in the App Router
  session: {
    strategy: "jwt",
    // Shorter than the 30-day default so stale roles / revoked sessions expire.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // Enable debug logs in development only
  debug: process.env.NODE_ENV === "development",
}

export default authOptions

import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // Connect Prisma + NextAuth
  adapter: PrismaAdapter(prisma),

  // OAuth Provider(s)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
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

      // Initial sign-in: stamp id + role from the freshly linked user.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.UserRole?.name ?? "member"
          token.roleSyncedAt = Date.now()
        }
        return token
      }

      // Subsequent requests: re-sync role when stale or explicitly refreshed.
      const stale =
        !token.roleSyncedAt || Date.now() - token.roleSyncedAt > ROLE_TTL_MS
      if (token.id && (trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { UserRole: true },
        })
        // User deleted => drop privileges; otherwise reflect current role.
        token.role = dbUser ? dbUser.UserRole?.name ?? "member" : undefined
        token.roleSyncedAt = Date.now()
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

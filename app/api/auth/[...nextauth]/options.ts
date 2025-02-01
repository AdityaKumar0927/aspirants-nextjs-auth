import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
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
            create: {
              name: "member",
              permissions: {},
            },
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
            create: {
              name: "member",
              permissions: {},
            },
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

    async jwt({ token, user }) {
      if (user && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { UserRole: true },
        })
        if (dbUser && dbUser.UserRole) {
          token.id = dbUser.id
          token.role = dbUser.UserRole.name
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
}

export default authOptions

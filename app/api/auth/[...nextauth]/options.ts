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
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { role: true },
      })

      if (!existingUser) {
        const memberRole = await prisma.userRole.findUnique({
          where: { name: 'member' },
        })

        if (!memberRole) {
          console.error("Member role not found")
          return false
        }

        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            roleId: memberRole.id,
          },
        })
      } else if (!existingUser.role) {
        const memberRole = await prisma.userRole.findUnique({
          where: { name: 'member' },
        })

        if (!memberRole) {
          console.error("Member role not found")
          return false
        }

        await prisma.user.update({
          where: { id: existingUser.id },
          data: { roleId: memberRole.id },
        })
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { role: true },
        })
        if (dbUser && dbUser.role) {
          token.role = dbUser.role.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/', // This will use the home page with the sign-in modal
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
}

export default authOptions
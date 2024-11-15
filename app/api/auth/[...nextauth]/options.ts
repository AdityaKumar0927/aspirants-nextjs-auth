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
      if (account?.provider === "google") {
        try {
          // Check if the user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { role: true },
          })

          if (!existingUser) {
            // If the user doesn't exist, create a new user with the "member" role
            const memberRole = await prisma.userRole.findUnique({
              where: { name: "member" },
            })

            if (!memberRole) {
              console.error("Member role not found in the database")
              return false
            }

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                roleId: memberRole.id,
              },
            })
          } else if (!existingUser.role) {
            // If the user exists but doesn't have a role, assign the "member" role
            const memberRole = await prisma.userRole.findUnique({
              where: { name: "member" },
            })

            if (!memberRole) {
              console.error("Member role not found in the database")
              return false
            }

            await prisma.user.update({
              where: { id: existingUser.id },
              data: { roleId: memberRole.id },
            })
          }

          return true
        } catch (error) {
          console.error("Error during sign in:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
}

export default authOptions
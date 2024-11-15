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
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sign-in attempt:", { user, account, profile, email, credentials });
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { role: true },
          });
          console.log("Existing user:", existingUser);

          if (!existingUser) {
            const memberRole = await prisma.userRole.findUnique({
              where: { name: "member" },
            });
            console.log("Member role:", memberRole);

            if (!memberRole) {
              console.error("Member role not found in the database");
              return false;
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                roleId: memberRole.id,
              },
            });
            console.log("New user created:", newUser);
          } else if (!existingUser.role) {
            const memberRole = await prisma.userRole.findUnique({
              where: { name: "member" },
            });
            console.log("Member role:", memberRole);

            if (!memberRole) {
              console.error("Member role not found in the database");
              return false;
            }

            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: { roleId: memberRole.id },
            });
            console.log("User updated with role:", updatedUser);
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("JWT callback:", { token, user, account });
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        console.log("DB user in JWT callback:", dbUser);
        if (dbUser && dbUser.role) {
          token.role = dbUser.role.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback:", { session, token });
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
};

export default authOptions;
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch the user's role and add it to the session
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true },
        });
        session.user.role = userWithRole?.role?.name || 'member';
      }
      return session;
    },
    async signIn({ user }) {
      // Check if the user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!existingUser) {
        // If the user doesn't exist, create a new user with the 'member' role
        const memberRole = await prisma.userRole.findUnique({
          where: { name: 'member' },
        });

        if (!memberRole) {
          console.error('Member role not found');
          return false;
        }

        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name,
            image: user.image,
            roleId: memberRole.id,
          },
        });
      }

      return true;
    },
  },
};
// utils/auth.ts
import { NextApiRequest } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Authorization check function
export const checkAuthorization = async (
  req: NextApiRequest,
  allowedRoles: string[]
): Promise<boolean> => {
  const session = await getSession({ req });

  // Check if session or user email is missing, return false
  if (!session || !session.user?.email) {
    return false;
  }

  // Fetch the user and their role from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });

  // Check if user exists and has a role that is allowed
  return Boolean(user && allowedRoles.includes(user.role?.name || ''));
};

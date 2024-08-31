import { NextApiRequest } from 'next';
import { getSession } from 'next-auth/react'; // Assuming you're using NextAuth for authentication
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkAuthorization = async (
  req: NextApiRequest,
  allowedRoles: string[]
): Promise<boolean> => {
  try {
    const session = await getSession({ req });

    // Check if the user is authenticated
    if (!session || !session.user?.email) {
      return false; // Return false instead of null
    }

    // Fetch the user and their role from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    // Check if the user has one of the allowed roles
    return user ? allowedRoles.includes(user.role?.name || '') : false; // Return false if user or role is missing
  } catch (error) {
    console.error('Error checking authorization:', error);
    return false; // Return false if there's an error
  }
};

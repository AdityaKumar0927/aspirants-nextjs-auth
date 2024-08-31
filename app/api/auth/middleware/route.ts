// middleware/auth.ts
import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getSession } from 'next-auth/react'; // Assuming you're using NextAuth for authentication
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authorize = (handler: NextApiHandler, allowedRoles: string[]) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession({ req });

    // Check if the user is authenticated
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Fetch the user and their role from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    // Check if the user has one of the allowed roles
    if (!user || !allowedRoles.includes(user.role?.name || '')) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Proceed with the handler if checks pass
    return handler(req, res);
  };
};

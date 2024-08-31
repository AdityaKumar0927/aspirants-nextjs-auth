// app/api/auth/middleware/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware function to verify user authorization
async function checkAuthorization(req: NextApiRequest, allowedRoles: string[]): Promise<boolean> {
  const session = await getSession({ req });

  // Verify if the user is authenticated
  if (!session || !session.user?.email) {
    return false;
  }

  // Fetch the user's role from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });

  // Confirm if the user's role is included in the allowed roles
  return Boolean(user && allowedRoles.includes(user.role?.name || ''));
}

// Handler function using the middleware for authorization checks
async function defaultHandler(req: NextApiRequest, res: NextApiResponse) {
  // Define allowed roles for this route
  const allowedRoles = ['administrator'];

  // Use the middleware function to check authorization
  const isAuthorized = await checkAuthorization(req, allowedRoles);

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  // Proceed with your main logic if authorized
  res.status(200).json({ message: 'User is authorized' });
}

// Export the default handler for the POST method
export const POST = defaultHandler;

// Optionally, export other methods if needed
export const GET = defaultHandler; // Example: Adjust logic as needed for GET requests

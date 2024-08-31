// app/api/user/role/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

// Middleware to check if the user is authorized based on their role
async function checkAuthorization(req: NextApiRequest, allowedRoles: string[]): Promise<boolean> {
  const session = await getSession({ req });

  if (!session || !session.user?.email) {
    return false;
  }

  // Fetch user and their role from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true },
  });

  // Check if the user's role is in the allowed roles
  return Boolean(user && allowedRoles.includes(user.role?.name || ''));
}

// Main handler function to update the user role
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if the user is authorized to update roles
  const isAuthorized = await checkAuthorization(req, ['administrator']);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  try {
    const { userId, roleName } = req.body;

    // Check if the role exists
    const role = await prisma.userRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });

    res.status(200).json({ message: 'User role updated successfully', updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

// Export the handler function for the POST method
export const POST = handler;

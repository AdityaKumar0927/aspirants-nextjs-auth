// app/api/user/role.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { checkAuthorization } from '../../auth/middleware/route'; // Adjust the path as needed

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check authorization for administrators
  const isAuthorized = await checkAuthorization(req, ['administrator']);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  try {
    const { userId, roleName } = req.body;

    // Find the role by its name
    const role = await prisma.userRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Update user's role by setting the roleId
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });

    return res.status(200).json({ message: 'User role updated successfully', updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
};

export default handler;

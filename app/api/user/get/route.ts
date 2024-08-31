// app/api/user/get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { checkAuthorization } from '../../auth/middleware/route'; // Adjust the path if necessary

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optional: Check authorization for administrators
  const isAuthorized = await checkAuthorization(req, ['administrator']);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  try {
    // Fetch all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true, // Assuming the role relation is set up correctly in your Prisma schema
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export default handler;

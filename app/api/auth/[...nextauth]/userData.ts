import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from "./options";
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userEmail = session.user?.email;

  if (!userEmail) {
    return res.status(400).json({ message: 'User email not found' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const userId = user.id;

  if (req.method === 'GET') {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        completedQuestions: true,
        markedForReviewQuestions: true,
        notes: true,
      },
    });

    return res.status(200).json(userData);
  }

  if (req.method === 'POST') {
    const { completedQuestions, markedForReviewQuestions, notes } = req.body;

    const updatedUserData = await prisma.user.update({
      where: { id: userId },
      data: {
        completedQuestions,
        markedForReviewQuestions,
        notes,
      },
    });

    return res.status(200).json(updatedUserData);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

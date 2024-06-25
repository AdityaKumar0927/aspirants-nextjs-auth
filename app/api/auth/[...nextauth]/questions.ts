import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const questions = await prisma.question.findMany();
    return res.status(200).json(questions);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

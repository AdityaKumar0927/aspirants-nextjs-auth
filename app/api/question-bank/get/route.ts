// pages/api/question-bank/get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  try {
    const questionBanks = await prisma.questionBank.findMany({
      where: { userId: String(userId) },
      include: { questions: true },
    });

    res.status(200).json(questionBanks);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch question banks' });
  }
}

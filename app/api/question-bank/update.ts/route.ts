// pages/api/question-bank/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { id, title, description, questions } = req.body;

    try {
      const questionBank = await prisma.questionBank.update({
        where: { id },
        data: {
          title,
          description,  // Ensure description is included
          questions: {
            deleteMany: {},  // Clear existing questions
            create: questions,
          },
        },
      });

      res.status(200).json(questionBank);
    } catch (error) {
      res.status(500).json({ error: 'Unable to update question bank' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

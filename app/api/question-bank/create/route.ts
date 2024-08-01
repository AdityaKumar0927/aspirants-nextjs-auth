// pages/api/question-bank/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, title, description, questions } = req.body;

    try {
      const questionBank = await prisma.questionBank.create({
        data: {
          userId,
          title,
          description,  // Ensure description is included
          questions: {
            create: questions,
          },
        },
      });

      res.status(200).json(questionBank);
    } catch (error) {
      res.status(500).json({ error: 'Unable to create question bank' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

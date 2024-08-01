// pages/api/question-bank/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { id } = req.body;

    try {
      await prisma.questionBank.delete({
        where: { id },
      });

      res.status(200).json({ message: 'Question bank deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Unable to delete question bank' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

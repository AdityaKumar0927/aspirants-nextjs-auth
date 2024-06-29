import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const questions = await prisma.question.findMany();
        res.status(200).json(questions);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
      }
      break;
      
    case 'POST':
      const { questionId, reviewed, completed } = req.body;
      
      if (reviewed !== undefined || completed !== undefined) {
        try {
          await prisma.question.update({
            where: { questionId },
            data: { reviewed, completed },
          });
          res.status(200).json({ message: 'Status updated' });
        } catch (error) {
          res.status(500).json({ error: 'Failed to update status' });
        }
      } else {
        res.status(400).json({ error: 'Invalid request' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { name, description, customQuestions } = req.body;

    try {
      const newQuestionBank = await prisma.customQuestionBank.create({
        data: {
          name,
          description,
          userId: session.user.id,
          customQuestions: {
            create: customQuestions.map((question: any) => ({
              questionId: question.questionId,
              text: question.text,
              subject: question.subject,
              topic: question.topic,
              subtopic: question.subtopic,
              difficulty: question.difficulty,
              type: question.type,
              year: parseInt(question.year, 10),
              reviewed: question.reviewed,
              completed: question.completed,
              options: question.options,
              correctOption: question.correctOption,
              markscheme: question.markscheme,
              marks: question.marks,
              correctAttempts: question.correctAttempts,
              wrongAttempts: question.wrongAttempts,
              averageTimeTaken: question.averageTimeTaken,
              lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
              diagramUrl: question.diagramUrl,
            })),
          },
        },
      });

      return res.status(200).json(newQuestionBank);
    } catch (error) {
      console.error('Error creating question bank:', error);
      return res.status(500).json({ message: 'Error creating question bank' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

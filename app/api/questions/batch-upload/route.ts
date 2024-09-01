// pages/api/questions/batch-upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    // Only allow POST requests
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const questions = req.body; // Parse the questions from the request body
    // Assuming questions is an array of question objects
    const createdQuestions = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true, // Optional: skip duplicates if any
    });

    return res.status(201).json(createdQuestions);
  } catch (error) {
    console.error('Error uploading batch of questions:', error);
    return res.status(500).json({ error: 'Failed to upload batch of questions' });
  }
}

// Import necessary libraries
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Adjust the import path as per your setup

// Define the API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { questions } = req.body; // Assuming questions are sent in a "questions" array

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty questions data' });
  }

  try {
    // Validate and format each question before inserting
    const formattedQuestions = questions.map((question) => ({
      exam: question.exam || '', // Ensure string values
      questionId: question.questionId || '',
      text: question.text || '',
      subject: question.subject || '',
      topic: question.topic || '',
      subtopic: question.subtopic || '',
      difficulty: question.difficulty || '',
      type: question.type || '',
      year: parseInt(question.year) || 0, // Ensure integer format for year
      reviewed: Boolean(question.reviewed),
      completed: Boolean(question.completed),
      options: question.options || [],
      correctOption: question.correctOption || '',
      markscheme: question.markscheme || '',
      marks: question.marks?.toString() || '', // Ensure marks are strings
      correctAttempts: question.correctAttempts?.toString() || '', // Ensure correctAttempts are strings
      wrongAttempts: question.wrongAttempts?.toString() || '', // Ensure wrongAttempts are strings
      averageTimeTaken: question.averageTimeTaken?.toString() || '', // Ensure averageTimeTaken is strings
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || '',
      status: question.status || 'ACTIVE', // Default status
    }));

    // Batch create questions using Prisma
    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true, // Optional: skips entries with duplicate keys
    });

    res.status(200).json({ message: 'Batch upload successful', result });
  } catch (error) {
    console.error('Error uploading batch:', error);
    res.status(500).json({ message: 'An error occurred during batch upload', error });
  }
}

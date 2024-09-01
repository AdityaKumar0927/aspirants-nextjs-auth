// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// POST method for batch uploading questions
export async function POST(req: Request) {
  // Check if the user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { questions } = await req.json();

    // Check if the questions array is valid
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    // Format and validate each question object similar to the working API
    const formattedQuestions = questions.map((question: any) => ({
      exam: question.exam || '',
      questionId: question.questionId || '',
      text: question.text || '',
      subject: question.subject || '',
      topic: question.topic || '',
      subtopic: question.subtopic || '',
      difficulty: question.difficulty || '',
      type: question.type || '',
      year: parseInt(question.year, 10) || 0, // Parse year as an integer
      reviewed: Boolean(question.reviewed),
      completed: Boolean(question.completed),
      options: question.options || [], // Ensure this is an array
      correctOption: question.correctOption || '',
      markscheme: question.markscheme || '',
      marks: question.marks?.toString() || null, // Convert marks to string or null
      correctAttempts: question.correctAttempts?.toString() || null, // Convert to string or null
      wrongAttempts: question.wrongAttempts?.toString() || null, // Convert to string or null
      averageTimeTaken: question.averageTimeTaken?.toString() || null, // Convert to string or null
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
      status: question.status || 'ACTIVE', // Default status
    }));

    // Use Prisma to batch create the formatted questions
    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true, // Skip duplicate entries based on unique constraints
    });

    // Respond with a success message and result
    return NextResponse.json({ message: 'Batch upload successful', result });
  } catch (error) {
    console.error('Error during batch upload:', error);
    return NextResponse.json(
      { message: 'An error occurred during batch upload', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

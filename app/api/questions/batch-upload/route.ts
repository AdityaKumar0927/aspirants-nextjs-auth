// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust the path based on your project structure

// POST method for batch uploading questions
export async function POST(request: Request) {
  try {
    const body = await request.json(); // Parse the incoming request body
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    // Format and validate each question object
    const formattedQuestions = questions.map((question) => ({
      exam: question.exam || '',
      questionId: question.questionId || '',
      text: question.text || '',
      subject: question.subject || '',
      topic: question.topic || '',
      subtopic: question.subtopic || '',
      difficulty: question.difficulty || '',
      type: question.type || '',
      year: parseInt(question.year) || 0, // Ensure integer format for the year
      reviewed: Boolean(question.reviewed),
      completed: Boolean(question.completed),
      options: question.options || [],
      correctOption: question.correctOption || '',
      markscheme: question.markscheme || '',
      marks: question.marks?.toString() || '', // Convert marks to string
      correctAttempts: question.correctAttempts?.toString() || '', // Convert correctAttempts to string
      wrongAttempts: question.wrongAttempts?.toString() || '', // Convert wrongAttempts to string
      averageTimeTaken: question.averageTimeTaken?.toString() || '', // Convert averageTimeTaken to string
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || '',
      status: question.status || 'ACTIVE', // Default status
    }));

    // Use Prisma to batch create the formatted questions
    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true, // Optional: Skips entries with duplicate keys
    });

    // Respond with success message
    return NextResponse.json({ message: 'Batch upload successful', result });
  } catch (error: unknown) {
    // Type guard to narrow down the error type
    if (error instanceof Error) {
      console.error('Error during batch upload:', error.message);
      return NextResponse.json(
        { message: 'An error occurred during batch upload', error: error.message },
        { status: 500 }
      );
    }
    // Handling non-standard errors
    return NextResponse.json(
      { message: 'An unexpected error occurred during batch upload' },
      { status: 500 }
    );
  }
}

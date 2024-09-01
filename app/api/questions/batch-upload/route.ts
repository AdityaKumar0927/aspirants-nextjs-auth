// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust the path based on your project structure

// Helper function to validate question object
function validateQuestion(question: any) {
  const requiredFields = [
    'exam',
    'questionId',
    'text',
    'subject',
    'topic',
    'subtopic',
    'difficulty',
    'type',
    'year',
    'reviewed',
    'completed',
    'options',
    'correctOption',
    'markscheme',
  ];
  
  for (const field of requiredFields) {
    if (!question.hasOwnProperty(field) || question[field] === undefined || question[field] === null) {
      return false;
    }
  }

  // Additional type checks
  if (!Array.isArray(question.options) || question.options.length === 0) {
    return false;
  }

  return true;
}

// POST method for batch uploading questions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    // Validate each question
    const formattedQuestions = questions.map((question) => {
      if (!validateQuestion(question)) {
        throw new Error('Validation failed for one or more questions');
      }

      return {
        exam: question.exam || '',
        questionId: question.questionId || '',
        text: question.text || '',
        subject: question.subject || '',
        topic: question.topic || '',
        subtopic: question.subtopic || '',
        difficulty: question.difficulty || '',
        type: question.type || '',
        year: parseInt(question.year) || 0,
        reviewed: Boolean(question.reviewed),
        completed: Boolean(question.completed),
        options: question.options || [],
        correctOption: question.correctOption || '',
        markscheme: question.markscheme || '',
        marks: question.marks?.toString() || '',
        correctAttempts: question.correctAttempts?.toString() || '',
        wrongAttempts: question.wrongAttempts?.toString() || '',
        averageTimeTaken: question.averageTimeTaken?.toString() || '',
        lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
        diagramUrl: question.diagramUrl || '',
        status: question.status || 'ACTIVE',
      };
    });

    // Use Prisma to batch create the formatted questions
    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: 'Batch upload successful', result });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during batch upload:', error.message);
      return NextResponse.json(
        { message: 'An error occurred during batch upload', error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred during batch upload' },
      { status: 500 }
    );
  }
}

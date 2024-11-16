import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

// POST method for batch uploading questions
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const questions = await req.json(); // Expecting a raw array of questions
    console.log('Received Questions:', questions);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid questions array:', questions);
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    const formattedQuestions = questions.map((question: any, index: number) => ({
      questionId: question.questionId || `auto-${index}`,
      text: question.text || '',
      subject: question.subject || 'General',
      topic: question.topic || 'Miscellaneous',
      subtopic: question.subtopic || null,
      difficulty: question.difficulty || 'Medium',
      type: question.type || 'Multiple Choice',
      year: question.year ? parseInt(question.year, 10) : new Date().getFullYear(),
      reviewed: question.reviewed ?? false,
      completed: question.completed ?? false,
      options: question.options || [],
      correctOption: question.correctOption || null,
      markscheme: question.markscheme || null,
      exam: question.exam || 'Unknown',
      marks: question.marks ? question.marks.toString() : '0',
      correctAttempts: question.correctAttempts || null,
      wrongAttempts: question.wrongAttempts || null,
      averageTimeTaken: question.averageTimeTaken || null,
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
      status: question.status || 'ACTIVE',
    }));

    console.log('Formatted Questions:', formattedQuestions);

    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: 'Batch upload successful', result });
  } catch (error) {
    // Use a type guard to check if the error is an instance of Error
    if (error instanceof Error) {
      console.error('Error during batch upload:', error.message);
      return NextResponse.json(
        { message: 'An error occurred during batch upload', error: error.message },
        { status: 500 }
      );
    } else {
      console.error('Unknown error during batch upload:', error);
      return NextResponse.json(
        { message: 'An unknown error occurred during batch upload' },
        { status: 500 }
      );
    }
  }
}
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
    const body = await req.json();
    console.log('Received Request Body:', body);

    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid or empty questions array:', questions);
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    const formattedQuestions = questions.map((question: any, index: number) => ({
      questionId: question.questionId || `auto-${index}`,  // Default unique ID
      text: question.text || '',  // Default to empty string
      subject: question.subject || 'General',  // Default to 'General'
      topic: question.topic || 'Miscellaneous',  // Default topic
      subtopic: question.subtopic || null,  // Optional
      difficulty: question.difficulty || 'Medium',  // Default difficulty
      type: question.type || 'Multiple Choice',  // Default type
      year: question.year ? parseInt(question.year, 10) : new Date().getFullYear(),  // Default to current year
      reviewed: question.reviewed ?? false,  // Default to false
      completed: question.completed ?? false,  // Default to false
      options: question.options || [],  // Default to an empty array
      correctOption: question.correctOption || null,  // Optional
      markscheme: question.markscheme || null,  // Optional
      exam: question.exam || 'Unknown',  // Default exam name
      marks: question.marks ? question.marks.toString() : '0',  // Default to '0'
      correctAttempts: question.correctAttempts ? question.correctAttempts.toString() : null,  // Optional
      wrongAttempts: question.wrongAttempts ? question.wrongAttempts.toString() : null,  // Optional
      averageTimeTaken: question.averageTimeTaken ? question.averageTimeTaken.toString() : null,  // Optional
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,  // Optional
      diagramUrl: question.diagramUrl || null,  // Optional
      status: question.status || 'ACTIVE',  // Default status to ACTIVE
    }));

    console.log('Formatted Questions:', formattedQuestions);

    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true,  // Skip duplicates based on unique constraints
    });

    return NextResponse.json({ message: 'Batch upload successful', result });
  } catch (error) {
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

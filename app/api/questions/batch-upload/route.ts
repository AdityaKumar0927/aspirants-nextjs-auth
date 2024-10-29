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
    console.log('Received request body:', body);

    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 });
    }

    const formattedQuestions = questions.map((question: any) => ({
      exam: question.exam || '',
      questionId: question.questionId || '',
      text: question.text || '',
      subject: question.subject || '',
      topic: question.topic || '',
      subtopic: question.subtopic || '',
      difficulty: question.difficulty || '',
      type: question.type || '',
      year: question.year ? parseInt(question.year, 10) : 0,
      reviewed: !!question.reviewed,
      completed: !!question.completed,
      options: Array.isArray(question.options) ? question.options : [],
      correctOption: question.correctOption || '',
      markscheme: question.markscheme || '',
      marks: question.marks ? question.marks.toString() : null,
      correctAttempts: question.correctAttempts ? question.correctAttempts.toString() : null,
      wrongAttempts: question.wrongAttempts ? question.wrongAttempts.toString() : null,
      averageTimeTaken: question.averageTimeTaken ? question.averageTimeTaken.toString() : null,
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
    console.error('Error during batch upload:', error);
    return NextResponse.json(
      { message: 'An error occurred during batch upload', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

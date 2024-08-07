import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, questions } = await request.json();

    if (!name || !description || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const newQuestionBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId: session.user.id,
        questions: {
          create: questions.map((question: any) => ({
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
            exam: question.exam,
            marks: question.marks,
            correctAttempts: question.correctAttempts,
            wrongAttempts: question.wrongAttempts,
            averageTimeTaken: question.averageTimeTaken,
            lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
            diagramUrl: question.diagramUrl || null,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(newQuestionBank);
  } catch (error) {
    console.error('Error creating question bank:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create question bank' }, { status: 500 });
  }
}

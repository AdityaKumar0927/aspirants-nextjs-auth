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

  const { name, description, questions } = await request.json();

  try {
    const newQuestionBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        user: { connect: { id: session.user.id } },
        questions: {
          create: questions.map((question: any) => ({
            exam: question.exam,
            questionId: question.questionId,
            text: question.text,
            subject: question.subject,
            topic: question.topic,
            subtopic: question.subtopic,
            difficulty: question.difficulty,
            type: question.type,
            year: question.year,
            reviewed: question.reviewed,
            completed: question.completed,
            options: question.options,
            correctOption: question.correctOption,
            markscheme: question.markscheme,
            marks: question.marks,
            correctAttempts: question.correctAttempts,
            wrongAttempts: question.wrongAttempts,
            averageTimeTaken: question.averageTimeTaken,
            lastAttempted: question.lastAttempted,
            diagramUrl: question.diagramUrl,
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
    return NextResponse.json({ error: 'Failed to create question bank' }, { status: 500 });
  }
}

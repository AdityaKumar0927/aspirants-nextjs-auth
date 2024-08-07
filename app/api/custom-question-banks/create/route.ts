import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession({ req: req as any });

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, customQuestions } = await req.json();

  try {
    const newQuestionBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId: session.user.id,
        customQuestions: {
          create: customQuestions.map((question: any) => ({
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
            marks: question.marks,
            correctAttempts: question.correctAttempts,
            wrongAttempts: question.wrongAttempts,
            averageTimeTaken: question.averageTimeTaken,
            lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
            diagramUrl: question.diagramUrl,
          })),
        },
      },
    });

    return NextResponse.json(newQuestionBank, { status: 200 });
  } catch (error) {
    console.error('Error creating question bank:', error);
    return NextResponse.json({ message: 'Error creating question bank' }, { status: 500 });
  }
}

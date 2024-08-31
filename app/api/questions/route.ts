// app/api/questions/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      select: {
        questionId: true,
        exam: true,
        text: true,
        subject: true,
        topic: true,
        subtopic: true,
        difficulty: true,
        type: true,
        year: true,
        reviewed: true,
        completed: true,
        options: true,
        correctOption: true,
        markscheme: true,
        notes: true,
        lastAttempted: true,
        diagramUrl: true,
      },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { questionId, ...updates } = await request.json();

  try {
    // Update the question in the database
    const updatedQuestion = await prisma.question.update({
      where: { questionId },
      data: updates,
    });

    // Re-fetch the updated question to ensure correct data
    const refreshedQuestion = await prisma.question.findUnique({
      where: { questionId },
      select: {
        questionId: true,
        exam: true,
        text: true,
        subject: true,
        topic: true,
        subtopic: true,
        difficulty: true,
        type: true,
        year: true,
        reviewed: true,
        completed: true,
        options: true,
        correctOption: true,
        markscheme: true,
        notes: true,
        lastAttempted: true,
        diagramUrl: true,
      },
    });

    if (!refreshedQuestion) {
      return NextResponse.json({ error: 'Question not found after update' }, { status: 404 });
    }

    return NextResponse.json(refreshedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

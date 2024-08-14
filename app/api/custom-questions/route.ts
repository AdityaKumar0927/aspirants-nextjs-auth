import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const customQuestions = await prisma.customQuestion.findMany({
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

    // Debugging: Log the fetched questions
    console.log('Custom Questions Fetched:', customQuestions);

    return NextResponse.json(customQuestions);
  } catch (error) {
    console.error("Failed to fetch custom questions:", error);
    return NextResponse.json({ error: 'Failed to fetch custom questions' }, { status: 500 });
  }
}

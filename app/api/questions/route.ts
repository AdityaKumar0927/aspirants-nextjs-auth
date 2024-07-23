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
      },
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { questionId, reviewed, completed } = await request.json();

  if (reviewed !== undefined || completed !== undefined) {
    try {
      await prisma.question.update({
        where: { questionId },
        data: { reviewed, completed },
      });
      return NextResponse.json({ message: 'Status updated' });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

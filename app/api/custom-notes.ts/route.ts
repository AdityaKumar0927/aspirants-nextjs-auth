import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userAnswers = await prisma.customUserAnswer.findMany();
    return NextResponse.json(userAnswers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user answers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { questionId, selectedOption, isCorrect } = await request.json();

  try {
    await prisma.customUserAnswer.create({
      data: { questionId, selectedOption, isCorrect },
    });
    return NextResponse.json({ message: 'Answer saved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}

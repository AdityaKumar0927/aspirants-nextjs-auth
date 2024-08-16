import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customUserAnswers = await prisma.customUserAnswer.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(customUserAnswers);
  } catch (error) {
    console.error('Error fetching custom user answers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, selectedOption, isCorrect } = await request.json();

    const customUserAnswer = await prisma.customUserAnswer.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId } },
      update: {
        selectedOption,
        isCorrect,
      },
      create: {
        userId: session.user.id,
        questionId,
        selectedOption,
        isCorrect,
      },
    });

    return NextResponse.json(customUserAnswer);
  } catch (error) {
    console.error('Error saving custom user answer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

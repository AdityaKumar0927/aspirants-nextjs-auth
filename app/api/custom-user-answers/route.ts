import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userAnswers = await prisma.customUserAnswer.findMany();
    return NextResponse.json(userAnswers);
  } catch (error) {
    console.error('Error fetching user answers:', error);
    return NextResponse.json({ error: 'Failed to fetch user answers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, selectedOption, isCorrect } = await request.json();

    await prisma.customUserAnswer.create({
      data: {
        questionId,
        selectedOption,
        isCorrect,
        user: { connect: { id: session.user.id } },
        question: { connect: { questionId } },
      },
    });

    return NextResponse.json({ message: 'Answer saved' });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}

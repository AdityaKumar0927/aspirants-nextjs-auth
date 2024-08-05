import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, description, questions } = await request.json();

    const updatedQuestionBank = await prisma.customQuestionBank.update({
      where: { id },
      data: {
        name,
        description,
        userId: session.user.id,
        questions: {
          set: questions.map((questionId: string) => ({ questionId })),
        },
      },
    });

    return NextResponse.json(updatedQuestionBank);
  } catch (error) {
    console.error('Error updating question bank:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

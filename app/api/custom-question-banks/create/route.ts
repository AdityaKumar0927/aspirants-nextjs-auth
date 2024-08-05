import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, questions } = await request.json();

    const newQuestionBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId: session.user.id,
        questions: {
          create: questions,
        },
      },
    });

    return NextResponse.json(newQuestionBank);
  } catch (error) {
    console.error('Error creating question bank:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

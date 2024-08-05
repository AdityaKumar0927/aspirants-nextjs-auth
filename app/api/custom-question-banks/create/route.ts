import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Correct the import path

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, questions } = await req.json();
  const userId = session.user.id;

  try {
    const newQuestionBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId,
        questions: {
          connect: questions.map((id: string) => ({ questionId: id })),
        },
      },
    });

    return NextResponse.json(newQuestionBank, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
  }
}

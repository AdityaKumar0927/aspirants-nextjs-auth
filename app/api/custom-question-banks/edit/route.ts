import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Correct the import path

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, name, description, questions } = await req.json();
  const userId = session.user.id;

  try {
    const updatedQuestionBank = await prisma.customQuestionBank.update({
      where: { id },
      data: {
        name,
        description,
        userId,
        questions: {
          set: questions.map((id: string) => ({ questionId: id })),
        },
      },
    });

    return NextResponse.json(updatedQuestionBank, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
  }
}

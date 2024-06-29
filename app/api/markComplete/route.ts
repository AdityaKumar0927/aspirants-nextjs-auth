// app/api/markComplete/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, completed } = await request.json();

    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: { completed },
      create: { userId: session.user.id, questionId, reviewed: false, completed },
    });

    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Error in markComplete API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

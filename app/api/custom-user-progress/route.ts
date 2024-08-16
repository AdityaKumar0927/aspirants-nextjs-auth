// /app/api/custom-user-progress/route.ts
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

    const customUserProgress = await prisma.customUserProgress.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(customUserProgress);
  } catch (error) {
    console.error('Error fetching custom user progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, completed, reviewed, lastAttempted } = await request.json();

    const customUserProgress = await prisma.customUserProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: {
        completed, 
        reviewed, 
        lastAttempted: lastAttempted ? new Date(lastAttempted) : null,
      },
      create: {
        userId: session.user.id,
        questionId,
        completed, 
        reviewed, 
        lastAttempted: lastAttempted ? new Date(lastAttempted) : null,
      },
    });

    return NextResponse.json(customUserProgress);
  } catch (error) {
    console.error('Error updating custom user progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

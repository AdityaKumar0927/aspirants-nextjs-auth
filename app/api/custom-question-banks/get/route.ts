import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionBanks = await prisma.customQuestionBank.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        customQuestions: true,
      },
    });

    return NextResponse.json(questionBanks);
  } catch (error) {
    console.error('Error fetching question banks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
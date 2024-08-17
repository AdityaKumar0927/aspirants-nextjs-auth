// /app/api/user-performance/get/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPerformance = await prisma.userPerformance.findMany({
      where: { userId: session.user.id },
    });

    console.log('User performance data fetched:', userPerformance);

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error('Error fetching user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
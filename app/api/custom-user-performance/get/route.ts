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

    const customUserPerformance = await prisma.customUserPerformance.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(customUserPerformance);
  } catch (error) {
    console.error('Error fetching custom user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

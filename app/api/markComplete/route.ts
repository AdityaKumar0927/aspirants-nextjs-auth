// app/api/markComplete/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { questionId, completed } = await request.json();

  try {
    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: 'some-user-id', // Replace with actual user ID from session
          questionId,
        },
      },
      update: { completed },
      create: { userId: 'some-user-id', questionId, reviewed: false, completed },
    });
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userProgress = await prisma.customUserProgress.findMany();
    return NextResponse.json(userProgress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { questionId, field, value } = await request.json();

  try {
    await prisma.customUserProgress.update({
      where: { questionId },
      data: { [field]: value },
    });
    return NextResponse.json({ message: 'Progress updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

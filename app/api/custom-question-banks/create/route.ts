import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  const { title, subtitle, questions } = data;

  const customQuestionBank = await prisma.customQuestionBank.create({
    data: {
      userId: session.user.id,
      title,
      subtitle,
      questions,
    },
  });

  return new NextResponse(JSON.stringify(customQuestionBank), { status: 200 });
}

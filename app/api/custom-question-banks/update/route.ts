import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id, title, subtitle, questions } = await request.json();

  const customQuestionBank = await prisma.customQuestionBank.update({
    where: { id },
    data: {
      title,
      subtitle,
      questions,
    },
  });

  return new NextResponse(JSON.stringify(customQuestionBank), { status: 200 });
}

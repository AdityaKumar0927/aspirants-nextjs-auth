import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await request.json();

  await prisma.customQuestionBank.delete({
    where: { id },
  });

  return new NextResponse('Deleted successfully', { status: 200 });
}

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bankId } = await request.json();

    await prisma.customQuestionBank.delete({
      where: { id: bankId },
    });

    return NextResponse.json({ message: 'Question Bank Deleted' });
  } catch (error) {
    console.error('Error deleting question bank:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

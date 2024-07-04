// app/api/notes/save.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, content } = await request.json();

    await prisma.note.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: { content },
      create: { userId: session.user.id, questionId, content },
    });

    return NextResponse.json({ message: 'Note saved successfully' });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

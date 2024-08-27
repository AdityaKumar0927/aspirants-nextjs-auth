// @/app/api/issues/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, area, securityLevel } = await request.json();

    if (!title || !description || !area || !securityLevel) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        category: {
          connectOrCreate: {
            where: { name: area },
            create: { name: area },
          },
        },
        priority: securityLevel,
        createdBy: {
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

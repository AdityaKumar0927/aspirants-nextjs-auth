import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, area, priority, questionId } = await request.json();

    // Validate that all required fields are present
    if (!title?.trim() || !description?.trim() || !area || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    //
    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        area: area.toUpperCase(),
        priority: priority.toUpperCase(),
        createdBy: { connect: { id: session.user.id } },
        question: questionId ? { connect: { questionId } } : undefined,
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issues = await prisma.issue.findMany({
      where: { createdById: session.user.id },
      include: { createdBy: true, question: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
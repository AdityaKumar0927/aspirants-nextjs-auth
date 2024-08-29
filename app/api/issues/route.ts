// @/app/api/issues/route.ts
import { PrismaClient, IssuePriority } from '@prisma/client'; // Import IssuePriority enum
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        category: true,
        comments: true,
      },
    });
    return NextResponse.json(issues, { status: 200 });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // Define the type of keys allowed in priorityMapping
    type PriorityKeys = '1' | '2' | '3' | '4';

    // Map string securityLevel to the enum values of IssuePriority
    const priorityMapping: Record<PriorityKeys, IssuePriority> = {
      '1': IssuePriority.CRITICAL,
      '2': IssuePriority.HIGH,
      '3': IssuePriority.MEDIUM,
      '4': IssuePriority.LOW,
    };

    const mappedPriority = priorityMapping[securityLevel as PriorityKeys] || IssuePriority.MEDIUM;

    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        priority: mappedPriority, // Use the mapped IssuePriority enum value
        category: {
          connectOrCreate: {
            where: { name: area },
            create: { name: area },
          },
        },
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

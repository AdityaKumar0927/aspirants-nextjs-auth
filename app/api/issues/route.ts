import { PrismaClient, IssuePriority } from '@prisma/client';
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

    // Log incoming request body for debugging
    const body = await request.json();
    console.log('Incoming request data:', body);

    const { title, description, area, securityLevel } = body;

    // Validate that all fields are present and not empty
    if (!title?.trim() || !description?.trim() || !area?.trim() || !securityLevel) {
      return NextResponse.json({ error: 'Missing or empty fields' }, { status: 400 });
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

    // Check if securityLevel is valid before mapping
    if (!Object.keys(priorityMapping).includes(securityLevel)) {
      return NextResponse.json({ error: 'Invalid security level' }, { status: 400 });
    }

    const mappedPriority = priorityMapping[securityLevel as PriorityKeys];

    // Create the issue
    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        priority: mappedPriority,
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

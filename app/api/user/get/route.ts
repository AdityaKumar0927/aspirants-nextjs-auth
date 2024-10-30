import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch the user with their role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    // Check if the user has the administrator role
    if (!user || user.role?.name !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch all users from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
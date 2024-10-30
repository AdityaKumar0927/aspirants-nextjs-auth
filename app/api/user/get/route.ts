import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated and has the necessary role
    if (!session || !session.user || session.user.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch all users from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
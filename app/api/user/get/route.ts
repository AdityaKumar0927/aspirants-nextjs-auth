// app/api/user/get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt'; // Assuming you use NextAuth for session management

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Retrieve the session using NextAuth's getToken function
    const token = await getToken({ req });

    // Check if the user is authenticated
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch all users from the database
    const users = await prisma.user.findMany({
      include: { role: true }, // Include roles if available
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

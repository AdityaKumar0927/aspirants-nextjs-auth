// app/api/auth/middleware/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // Using getToken instead of getServerSession
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware function to check authorization
export async function GET(req: NextRequest) {
  try {
    // Retrieve the session using NextAuth's getToken function
    const token = await getToken({ req });

    // Check if the user is authenticated
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Fetch the user and their role from the database
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      include: { role: true },
    });

    // Define allowed roles
    const allowedRoles = ['administrator', 'moderator']; // Adjust roles as needed

    // Check if the user has one of the allowed roles
    if (!user || !allowedRoles.includes(user.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // If all checks pass, return a success response
    return NextResponse.json({ message: 'Authorized' });
  } catch (error) {
    console.error('Error in authorization middleware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

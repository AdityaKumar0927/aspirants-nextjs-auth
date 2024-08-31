// app/api/user/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt'; // Assuming you're using NextAuth for authentication

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Retrieve the session token using NextAuth's getToken function
    const token = await getToken({ req });

    // Check if the user is authenticated
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Parse the request body
    const { userId, roleName } = await req.json();

    // Validate role
    const role = await prisma.userRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });

    return NextResponse.json({ message: 'User role updated successfully', updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

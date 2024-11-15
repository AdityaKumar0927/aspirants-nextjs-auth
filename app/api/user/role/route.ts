import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuthorization } from '../../auth/middleware/route';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const authResult = await checkAuthorization(req, ['administrator']);
  if (authResult.status !== 200) {
    return authResult;
  }

  try {
    const { userId, roleName } = await req.json();

    if (!userId || !roleName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const role = await prisma.userRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    });

    return NextResponse.json({ 
      message: 'User role updated successfully', 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role?.name,
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

type AuthResult = {
  authorized: boolean;
  user?: {
    id: string;
    email: string | null;
    role: string | null;
  };
  error?: string;
};

async function checkAuthorization(req: NextRequest, allowedRoles: string[]): Promise<AuthResult> {
  try {
    const token = await getToken({ req });

    if (!token || !token.email) {
      return { authorized: false, error: 'Unauthorized access' };
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
      include: { role: true },
    });

    if (!user || !allowedRoles.includes(user.role?.name || '')) {
      return { authorized: false, error: 'Forbidden: Insufficient permissions' };
    }

    return { 
      authorized: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role?.name || null 
      } 
    };
  } catch (error) {
    console.error('Error in authorization middleware:', error);
    return { authorized: false, error: 'Internal server error' };
  }
}

export async function POST(req: NextRequest) {
  const authResult = await checkAuthorization(req, ['administrator']);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.error === 'Unauthorized access' ? 401 : 403 });
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
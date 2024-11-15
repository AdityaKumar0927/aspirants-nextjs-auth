import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkAuthorization(req: NextRequest, allowedRoles: string[]) {
  try {
    const token = await getToken({ req });

    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
      include: { role: true },
    });

    if (!user || !allowedRoles.includes(user.role?.name || '')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Authorized', user: { id: user.id, email: user.email, role: user.role?.name } });
  } catch (error) {
    console.error('Error in authorization middleware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return checkAuthorization(req, ['administrator', 'moderator']);
}
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { name: true, dob: true, language: true },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching account settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, dob, language } = data;

    const dobDate = dob ? new Date(dob) : new Date();

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: { name, dob: dobDate, language },
      create: { userId: session.user.id, name, dob: dobDate, language, username: '', email: '', bio: '', urls: {} },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating account settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

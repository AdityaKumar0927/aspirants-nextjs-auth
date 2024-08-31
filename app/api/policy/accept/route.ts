// app/api/policy/accept/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Adjust the import path if needed

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policyName, accepted } = await request.json();

    // Validate incoming request
    if (!policyName || typeof accepted !== 'boolean') {
      return NextResponse.json({ message: 'Invalid input data' }, { status: 400 });
    }

    // Check if the policy already exists
    const policy = await prisma.userPolicyAgreement.upsert({
      where: {
        userId_policyName: {
          userId: session.user.id,
          policyName,
        },
      },
      update: { accepted, acceptedAt: new Date() },
      create: {
        userId: session.user.id,
        policyName,
        accepted,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Policy status updated successfully', policy }, { status: 200 });
  } catch (error) {
    console.error('Error updating policy agreement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
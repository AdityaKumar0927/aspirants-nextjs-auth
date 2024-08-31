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

    // Validate the incoming request
    if (!policyName || typeof accepted !== 'boolean') {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    // Find or create the policy agreement for the user
    const policyAgreement = await prisma.userPolicyAgreement.upsert({
      where: {
        userId_policyName: {
          userId: session.user.id,
          policyName,
        },
      },
      update: { accepted, acceptedAt: accepted ? new Date() : null },
      create: {
        userId: session.user.id,
        policyName,
        accepted,
        acceptedAt: accepted ? new Date() : null,
      },
    });

    return NextResponse.json({ message: 'Policy updated successfully', policyAgreement });
  } catch (error) {
    console.error('Error updating policy agreement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
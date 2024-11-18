import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policyName, accepted } = await req.json();

    if (!policyName || typeof accepted !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const policy = await prisma.userPolicyAgreement.upsert({
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

    return NextResponse.json({ message: 'Policy status updated successfully', policy });
  } catch (error) {
    console.error('Error updating policy agreement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
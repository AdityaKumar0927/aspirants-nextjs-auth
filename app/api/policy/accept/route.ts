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

    const { policyName } = await request.json();

    if (!policyName) {
      return NextResponse.json({ error: 'Policy name is required' }, { status: 400 });
    }

    // Create a new policy acceptance record for the user
    const policyAgreement = await prisma.userPolicyAgreement.create({
      data: {
        userId: session.user.id,
        policyName,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Policy accepted successfully', policyAgreement });
  } catch (error) {
    console.error('Error accepting policy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

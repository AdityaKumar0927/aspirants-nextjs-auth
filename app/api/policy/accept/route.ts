// app/api/policy/accept/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// Define the route handler
export async function POST(req: Request) {
  const session = await getServerSession(); // Fetch the session for the authenticated user

  // Check if the user is signed in
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { policyName } = await req.json(); // Parse the request body

  // Validate the incoming request
  if (!policyName) {
    return NextResponse.json({ message: 'Policy name is required' }, { status: 400 });
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Create a new policy acceptance record
    await prisma.userPolicyAgreement.create({
      data: {
        userId: user.id,
        policyName,
      },
    });

    return NextResponse.json({ message: 'Policy accepted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

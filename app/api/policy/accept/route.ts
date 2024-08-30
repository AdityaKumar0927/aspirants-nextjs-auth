// pages/api/policy/accept.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the session to validate the user
  const session = await getSession({ req });

  // Check if session exists and has user information
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { policyName } = req.body;

  // Validate that the policy name is provided
  if (!policyName) {
    return res.status(400).json({ message: 'Policy name is required' });
  }

  try {
    // Find the user based on the email from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // If user is not found, respond with a 404 error
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new policy agreement record for the user
    await prisma.userPolicyAgreement.create({
      data: {
        userId: user.id,
        policyName,
        acceptedAt: new Date(), // Ensure the timestamp is recorded
      },
    });

    // Send a success response
    res.status(200).json({ message: 'Policy accepted successfully' });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

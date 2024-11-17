import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();

    // Validate the request body
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: {
        id: id
      },
      data: data
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Keep the existing GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const application = await prisma.application.findUnique({
      where: {
        id: id
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
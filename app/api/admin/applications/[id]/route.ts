import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { status } = await request.json()

    // Validate input
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, role, experience, motivation } = await request.json()

    // Validate input
    if (!name || !email || !role || !experience || !motivation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the user ID from the session
    const userId = session.user.id

    // Create new application
    const newApplication = await prisma.application.create({
      data: {
        name,
        email,
        role,
        experience,
        motivation,
        status: 'PENDING',
        user: {
          connect: {
            id: userId
          }
        }
      },
    })

    return NextResponse.json(newApplication)
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
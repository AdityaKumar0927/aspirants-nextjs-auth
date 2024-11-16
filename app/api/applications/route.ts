import { NextResponse } from 'next/server'
import { PrismaClient, ApplicationRole } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, role, experience, motivation } = await request.json()

    // Validate input
    if (!name || !role || !experience || !motivation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate and convert role to enum
    let applicationRole: ApplicationRole
    if (role.toUpperCase() === 'VOLUNTEER') {
      applicationRole = ApplicationRole.VOLUNTEER
    } else if (role.toUpperCase() === 'MODERATOR') {
      applicationRole = ApplicationRole.MODERATOR
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create new application
    const newApplication = await prisma.application.create({
      data: {
        name,
        email: session.user.email!,
        role: applicationRole,
        experience,
        motivation,
        status: 'PENDING',
        user: {
          connect: {
            email: session.user.email!
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
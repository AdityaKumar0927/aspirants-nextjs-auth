import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/options'

export async function GET() {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, priority, area } = await req.json()
    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        area,
        status: 'OPEN',
        createdBy: { connect: { email: session.user?.email } },
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    return NextResponse.json(newIssue)
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

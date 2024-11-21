import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '@/app/api/auth/[...nextauth]/options'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const prisma = new PrismaClient()

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const note = await prisma.note.findFirst({
      where: {
        questionId: params.id,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { content, title, type } = await req.json()

    if (!content || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const note = await prisma.note.findUnique({
      where: { id: params.id },
    })

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: { content, title, type },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const note = await prisma.note.findUnique({
      where: { id: params.id },
    })

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
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

export async function GET(req: NextRequest) {
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

    const notes = await prisma.note.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/notes error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const { title, content, type, questionId } = await req.json()

    if (!title || !content || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        type,
        questionId,
        userId,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('POST /api/notes error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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

    const { id, title, content, type } = await req.json()

    if (!id || !title || !content || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const note = await prisma.note.findUnique({
      where: { id },
    })

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { title, content, type },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('PUT /api/notes error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 })
    }

    const note = await prisma.note.findUnique({
      where: { id },
    })

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/notes error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
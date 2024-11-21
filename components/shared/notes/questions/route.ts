import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from "next-auth/next"
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

// GET /api/notes/question - Get question-specific notes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: userId,
        questionId: questionId,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        question: {
          select: {
            questionId: true,
          }
        }
      }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching question-specific notes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
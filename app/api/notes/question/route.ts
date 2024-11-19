import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import authOptions from '../../auth/[...nextauth]/options'

// GET /api/notes/question - Get question-specific notes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ message: 'Question ID is required' }, { status: 400 })
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
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
    return NextResponse.json(
      { message: 'Error fetching question-specific notes' },
      { status: 500 }
    )
  }
}
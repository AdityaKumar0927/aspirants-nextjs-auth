import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import authOptions from '../auth/[...nextauth]/options'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, content, title, type } = body

    // Check if a note already exists for this question and user
    const existingNote = await prisma.note.findFirst({
      where: {
        questionId: questionId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingNote) {
      // Update existing note
      const updatedNote = await prisma.note.update({
        where: {
          id: existingNote.id,
        },
        data: {
          content,
          title,
          type,
        },
      })
      return NextResponse.json(updatedNote)
    }

    // Create new note if none exists
    const note = await prisma.note.create({
      data: {
        questionId,
        content,
        title,
        type,
        user: {
          connect: {
            id: session.user.id
          }
        }
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating/updating note:', error)
    return NextResponse.json(
      { message: 'Error creating/updating note' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        questionId: questionId || null,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { message: 'Error fetching notes' },
      { status: 500 }
    )
  }
}
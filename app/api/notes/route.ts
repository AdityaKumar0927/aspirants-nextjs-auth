import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import authOptions from '../auth/[...nextauth]/options'
import { NoteType, Prisma } from '@prisma/client'

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, content, title, type } = body

    if (!Object.values(NoteType).includes(type)) {
      return NextResponse.json({ message: 'Invalid note type' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        questionId,
        content,
        title,
        type: type as NoteType,
        userId: session.user.id,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { message: 'Error creating note' },
      { status: 500 }
    )
  }
}

// GET /api/notes - Get all notes for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
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
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { message: 'Error fetching notes' },
      { status: 500 }
    )
  }
}

// PUT /api/notes - Update a note
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, content, title, type } = body

    if (!Object.values(NoteType).includes(type)) {
      return NextResponse.json({ message: 'Invalid note type' }, { status: 400 })
    }

    const updatedNote = await prisma.note.updateMany({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        content,
        title,
        type: type as NoteType,
      },
    })

    if (updatedNote.count === 0) {
      return NextResponse.json({ message: 'Note not found or you do not have permission to update it' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Note updated successfully' })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { message: 'Error updating note' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'Note ID is required' }, { status: 400 })
    }

    const deletedNote = await prisma.note.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (deletedNote.count === 0) {
      return NextResponse.json({ message: 'Note not found or you do not have permission to delete it' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { message: 'Error deleting note' },
      { status: 500 }
    )
  }
}
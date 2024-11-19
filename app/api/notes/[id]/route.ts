import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Find the most recent note for this question
    const note = await prisma.note.findFirst({
      where: {
        questionId: params.id, // Use the string directly
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { message: 'Error fetching note' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content, title, type } = body

    const updatedNote = await prisma.note.update({
      where: {
        id: params.id,
      },
      data: {
        content,
        title,
        type,
      },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { message: 'Error updating note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { message: 'Error deleting note' },
      { status: 500 }
    )
  }
}
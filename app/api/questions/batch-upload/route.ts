import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/options'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const questions = await req.json()
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid or empty questions data:', questions)
      return NextResponse.json({ message: 'Invalid or empty questions data' }, { status: 400 })
    }

    // Because your schema now has 'updatedAt DateTime @updatedAt' on Question,
    // you do not have to supply 'updatedAt' in your data.
    const formattedQuestions = questions.map((q: any, index: number) => ({
      questionId: q.questionId || `auto-${index}`,
      text: q.text || '',
      subject: q.subject || 'General',
      topic: q.topic || 'Miscellaneous',
      subtopic: q.subtopic || null,
      difficulty: q.difficulty || 'Medium',
      type: q.type || 'Multiple Choice',
      year: q.year ? parseInt(q.year, 10) : new Date().getFullYear(),
      reviewed: q.reviewed ?? false,
      completed: q.completed ?? false,
      options: q.options || [],
      correctOption: q.correctOption || null,
      markscheme: q.markscheme || null,
      exam: q.exam || 'Unknown',
      marks: q.marks ? parseFloat(q.marks) : 0,
      correctAttempts: q.correctAttempts || null,
      wrongAttempts: q.wrongAttempts || null,
      averageTimeTaken: q.averageTimeTaken || null,
      lastAttempted: q.lastAttempted ? new Date(q.lastAttempted) : null,
      diagramUrl: q.diagramUrl || null,
      status: q.status || 'ACTIVE',
      // If you want to specify createdAt, do it here. Or let it default.
      // createdAt: new Date(),
      // updatedAt: new Date(), // not needed if you have @updatedAt
    }))

    const result = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true,
    })

    return NextResponse.json({ message: 'Batch upload successful', result })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error during batch upload:', error.message)
      return NextResponse.json(
        { message: 'An error occurred during batch upload', error: error.message },
        { status: 500 }
      )
    } else {
      console.error('Unknown error during batch upload:', error)
      return NextResponse.json(
        { message: 'An unknown error occurred during batch upload' },
        { status: 500 }
      )
    }
  }
}

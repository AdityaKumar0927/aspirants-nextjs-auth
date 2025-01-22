import { PrismaClient, Prisma, QuestionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET all questions
export async function GET() {
  try {
    // We SELECT all relevant fields from your schema:
    const questions = await prisma.question.findMany({
      select: {
        // Basic question identity
        questionId: true,
        examGroup: true,
        country: true,
        exam: true,
        key: true,
        date: true,
        description: true,
        isMemoryBased: true,
        isOnline: true,
        languages: true,
        title: true,
        year: true,

        // PYQ fields
        pyqOutOfSyllabus: true,
        pyqTotal: true,
        pyqPrivate: true,
        pyqPublic: true,

        // Syllabus group
        examId: true,
        subjectGroup: true,
        chapterGroup: true,
        chapter: true,
        topicName: true,
        examDate: true,
        content: true,
        permalink: true,
        paperId: true,
        isOutOfSyllabus: true,
        isBonus: true,

        // Core question data
        text: true,
        subject: true,
        topic: true,
        subtopic: true,
        difficulty: true,
        type: true,
        marks: true,
        negMarks: true,
        options: true,
        correctOption: true,
        markscheme: true,

        // Attempts & stats
        correctAttempts: true,
        wrongAttempts: true,
        averageTimeTaken: true,
        lastAttempted: true,

        // Extra question metadata
        diagramUrl: true,
        customTag: true,
        explanation: true,           // JSON for explanations
        reviewed: true,
        completed: true,
        paperTitle: true,
        timeAllotted: true,
        updatedTime: true,
        updatedBy: true,
        source: true,
        peerSolvedPercentage: true,  // e.g. show how many solved on 1st try
        linkedResources: true,       // JSON for resources
        commonMistakes: true,        // JSON for typical mistakes
        discussionLink: true,
        parentQuestionId: true,
        difficultyRating: true,      // numeric rating (1=easy,2=medium,3=hard)
        yearKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

// POST a new question
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // If needed: map difficultyRating -> difficulty string
    // e.g. data.difficultyRating=1 => data.difficulty='easy'
    if (data.difficultyRating !== undefined) {
      if (data.difficultyRating === 1) data.difficulty = 'easy'
      else if (data.difficultyRating === 2) data.difficulty = 'medium'
      else if (data.difficultyRating === 3) data.difficulty = 'hard'
    }

    // If status not provided, default to ACTIVE or DRAFT
    const status = data.status || QuestionStatus.ACTIVE

    // Because you have JSON fields (explanation, commonMistakes, etc.),
    // Prisma can handle them as standard JS objects, as long as they are valid JSON.

    const created = await prisma.question.create({
      data: {
        ...data,
        status,
        // Possibly set "updatedTime" or "createdAt" manually if desired
        updatedTime: Math.floor(Date.now() / 1000),
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

// PATCH an existing question
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    // If the user updated difficultyRating, also set difficulty string
    if (rest.difficultyRating !== undefined) {
      const rating = Number(rest.difficultyRating)
      if (rating === 1) rest.difficulty = 'easy'
      else if (rating === 2) rest.difficulty = 'medium'
      else if (rating === 3) rest.difficulty = 'hard'
    }

    // If a user is updating, set updatedTime to now. Also store updatedBy if provided.
    rest.updatedTime = Math.floor(Date.now() / 1000)
    // e.g. if "rest.updatedBy" is set from the front-end, keep it

    // If we want to cast rest.status -> enum, do so carefully
    if (rest.status) {
      if (!Object.values(QuestionStatus).includes(rest.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      // rest.status is a valid QuestionStatus
    }

    // Update the question
    const updated = await prisma.question.update({
      where: { questionId },
      data: {
        ...rest,
        // any logic for peerSolvedPercentage if needed
        // e.g. if we update counters, we could recalc here
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

// DELETE a question
export async function DELETE(request: Request) {
  try {
    const { questionId } = await request.json()

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    await prisma.question.delete({
      where: { questionId },
    })

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
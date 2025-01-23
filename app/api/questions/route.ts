import { PrismaClient, QuestionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

/**
 * GET /api/questions
 *
 * Supports server-side pagination via ?page=1&pageSize=10
 * Returns: 
 * {
 *   data: Question[],
 *   currentPage: number,
 *   pageSize: number,
 *   totalCount: number
 * }
 */
export async function GET(request: Request) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

    // (Optional) parse filters if needed. Example:
    // const examFilter = searchParams.get('exam')
    // const subjectFilter = searchParams.get('subject')
    // Then build a "where" object
    // const where: any = {}
    // if (examFilter) where.exam = examFilter
    // if (subjectFilter) where.subject = subjectFilter

    // 2. Calculate pagination
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 3. Query the slice of questions
    const questions = await prisma.question.findMany({
      skip,
      take,
      // where, // if you built a where object for filters
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
        options: true,         // stored as JSON/array
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
        explanation: true,     // stored as JSON
        reviewed: true,
        completed: true,
        paperTitle: true,
        timeAllotted: true,
        updatedTime: true,
        updatedBy: true,
        source: true,
        peerSolvedPercentage: true,
        linkedResources: true, // stored as JSON
        commonMistakes: true,  // stored as JSON
        discussionLink: true,
        parentQuestionId: true,
        difficultyRating: true,
        yearKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 4. Count total for pagination
    const totalCount = await prisma.question.count({
      // where, // match the same filters if used
    })

    // (Optional) If you want to do any JSON stringification:
    // questions.forEach((q) => {
    //   if (typeof q.explanation === 'object') {
    //     q.explanation = JSON.stringify(q.explanation)
    //   }
    //   // etc...
    // })

    return NextResponse.json({
      data: questions,
      currentPage: page,
      pageSize,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching paginated questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

/**
 * POST /api/questions
 * Create a new question. Expects JSON body with question data (including JSON fields).
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // If user sent JSON fields as strings, parse them:
    if (typeof data.options === 'string') {
      try { data.options = JSON.parse(data.options) } catch {}
    }
    if (typeof data.explanation === 'string') {
      try { data.explanation = JSON.parse(data.explanation) } catch {}
    }
    if (typeof data.linkedResources === 'string') {
      try { data.linkedResources = JSON.parse(data.linkedResources) } catch {}
    }
    if (typeof data.commonMistakes === 'string') {
      try { data.commonMistakes = JSON.parse(data.commonMistakes) } catch {}
    }

    // Map difficultyRating -> difficulty string if present
    if (data.difficultyRating !== undefined) {
      if (data.difficultyRating === 1) data.difficulty = 'easy'
      else if (data.difficultyRating === 2) data.difficulty = 'medium'
      else if (data.difficultyRating === 3) data.difficulty = 'hard'
    }

    // Default status if not provided
    const status = data.status || QuestionStatus.ACTIVE

    const created = await prisma.question.create({
      data: {
        ...data,
        status,
        updatedTime: Math.floor(Date.now() / 1000),
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

/**
 * PATCH /api/questions
 * Update an existing question by questionId.
 * Expects JSON body: { questionId: string, ...fields }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    // If user updated JSON fields as strings, parse them:
    if (typeof rest.options === 'string') {
      try { rest.options = JSON.parse(rest.options) } catch {}
    }
    if (typeof rest.explanation === 'string') {
      try { rest.explanation = JSON.parse(rest.explanation) } catch {}
    }
    if (typeof rest.linkedResources === 'string') {
      try { rest.linkedResources = JSON.parse(rest.linkedResources) } catch {}
    }
    if (typeof rest.commonMistakes === 'string') {
      try { rest.commonMistakes = JSON.parse(rest.commonMistakes) } catch {}
    }

    // Map difficultyRating -> difficulty string
    if (rest.difficultyRating !== undefined) {
      const rating = Number(rest.difficultyRating)
      if (rating === 1) rest.difficulty = 'easy'
      else if (rating === 2) rest.difficulty = 'medium'
      else if (rating === 3) rest.difficulty = 'hard'
    }

    // Update 'updatedTime'
    rest.updatedTime = Math.floor(Date.now() / 1000)

    // Validate status if provided
    if (rest.status) {
      if (!Object.values(QuestionStatus).includes(rest.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    const updated = await prisma.question.update({
      where: { questionId },
      data: rest,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

/**
 * DELETE /api/questions
 * Delete a question. Expects JSON body: { questionId: "abc123" }
 */
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

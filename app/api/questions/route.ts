import { NextResponse } from 'next/server'
import { PrismaClient, QuestionStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/questions
 * - Query parameters:
 *   ?page=1&pageSize=10
 *   ?exam=JEE
 *   ?subject=Physics
 *   ?topic=Mechanics
 *   ?subtopic=Kinematics
 *   ?difficulty=easy
 *   ?year=2023
 *   ?type=Multiple+Choice
 *   ?search=keyword
 *
 * Returns paginated + filtered list of questions:
 * {
 *   data: Question[],
 *   currentPage: number,
 *   pageSize: number,
 *   totalCount: number
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // 1. Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 2. Parse optional filters
    const examFilter = searchParams.get('exam') || undefined
    const subjectFilter = searchParams.get('subject') || undefined
    const topicFilter = searchParams.get('topic') || undefined
    const subtopicFilter = searchParams.get('subtopic') || undefined
    const difficultyFilter = searchParams.get('difficulty') || undefined
    const yearFilter = searchParams.get('year') || undefined
    const typeFilter = searchParams.get('type') || undefined
    const searchQuery = searchParams.get('search') || undefined

    // 3. Build Prisma "where" object for filters
    const where: any = {}

    if (examFilter) {
      where.exam = examFilter
    }
    if (subjectFilter) {
      where.subject = subjectFilter
    }
    if (topicFilter) {
      where.topic = topicFilter
    }
    if (subtopicFilter) {
      where.subtopic = subtopicFilter
    }
    if (difficultyFilter) {
      where.difficulty = difficultyFilter
    }
    if (yearFilter) {
      // year in DB is likely a number; parse yearFilter to number
      where.year = parseInt(yearFilter, 10)
    }
    if (typeFilter) {
      where.type = typeFilter
    }

    // Optional text search in the "text" field (and/or "title", etc.)
    // NOTE: For large production DBs, consider a full-text index or advanced search approach.
    if (searchQuery) {
      where.text = {
        contains: searchQuery,
        mode: 'insensitive',
      }
    }

    // 4. Query for the paginated items
    const questions = await prisma.question.findMany({
      skip,
      take,
      where,
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
        explanation: true,
        reviewed: true,
        completed: true,
        paperTitle: true,
        timeAllotted: true,
        updatedTime: true,
        updatedBy: true,
        source: true,
        peerSolvedPercentage: true,
        linkedResources: true,
        commonMistakes: true,
        discussionLink: true,
        parentQuestionId: true,
        difficultyRating: true,
        yearKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 5. Get total count for pagination
    const totalCount = await prisma.question.count({
      where,
    })

    return NextResponse.json({
      data: questions,
      currentPage: page,
      pageSize,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/questions
 * Create a new question. Expects JSON body with question data.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()

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
        // Possibly set an explicit 'updatedTime'
        updatedTime: Math.floor(Date.now() / 1000),
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/questions
 * Update an existing question. Expects a JSON body with { questionId, ...fields }.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      )
    }

    // Map difficultyRating -> difficulty string
    if (rest.difficultyRating !== undefined) {
      const rating = Number(rest.difficultyRating)
      if (rating === 1) rest.difficulty = 'easy'
      else if (rating === 2) rest.difficulty = 'medium'
      else if (rating === 3) rest.difficulty = 'hard'
    }

    // Update 'updatedTime' whenever we PATCH
    rest.updatedTime = Math.floor(Date.now() / 1000)

    // Validate status if provided
    if (rest.status) {
      if (!Object.values(QuestionStatus).includes(rest.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.question.update({
      where: { questionId },
      data: rest,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/questions
 * Delete a question. Expects a JSON body with { questionId }.
 */
export async function DELETE(request: Request) {
  try {
    const { questionId } = await request.json()

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      )
    }

    await prisma.question.delete({
      where: { questionId },
    })

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}

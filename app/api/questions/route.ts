import { PrismaClient, QuestionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

/**
 * GET /api/questions
 *
 * - By default, supports server-side pagination via ?page=1&pageSize=10
 * - If the client passes ?all=true, fetch *all* questions at once (may risk timeouts).
 *
 * Returns:
 * {
 *   data: Question[],
 *   currentPage?: number,
 *   pageSize?: number,
 *   totalCount?: number
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const allMode = searchParams.get('all') === 'true' // e.g. ?all=true
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '10', 10)

    // Optional: parse filters (exam, subject, etc.) to build "where" object.
    // e.g. const examFilter = searchParams.get('exam')
    // const where: any = {}
    // if (examFilter) where.exam = examFilter

    let data, totalCount, currentPage, pageSize

    if (allMode) {
      // WARNING: This can cause timeouts if the table is huge!
      data = await prisma.question.findMany({
        // where,
        select: {
          questionId: true,
          examGroup: true,
          // ... snip (include whatever fields you need)
          updatedAt: true,
        },
      })
      totalCount = data.length
      // no pagination fields in the response
      return NextResponse.json({ data, totalCount })
    } else {
      // PAGINATED mode
      const page = pageParam < 1 ? 1 : pageParam
      const pageSizeNum = pageSizeParam < 1 ? 10 : pageSizeParam

      const skip = (page - 1) * pageSizeNum
      const take = pageSizeNum

      data = await prisma.question.findMany({
        skip,
        take,
        // where,
        select: {
          questionId: true,
          examGroup: true,
          // ... snip (include whatever fields you need)
          updatedAt: true,
        },
      })

      totalCount = await prisma.question.count({
        // where,
      })

      currentPage = page
      pageSize = pageSizeNum

      return NextResponse.json({
        data,
        currentPage,
        pageSize,
        totalCount,
      })
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

/**
 * POST /api/questions
 * Create a new question. Expects JSON with question data (including JSON fields).
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // If user sent JSON fields as strings, parse them
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

    // Map difficultyRating -> difficulty string
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

    // If user updated JSON fields as strings, parse them
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

    // If user updated difficultyRating, map to a difficulty string
    if (rest.difficultyRating !== undefined) {
      const rating = Number(rest.difficultyRating)
      if (rating === 1) rest.difficulty = 'easy'
      else if (rating === 2) rest.difficulty = 'medium'
      else if (rating === 3) rest.difficulty = 'hard'
    }

    // Always update 'updatedTime'
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

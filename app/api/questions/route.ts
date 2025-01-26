import { NextResponse } from 'next/server'
import { PrismaClient, QuestionStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/questions
 * By default, returns ALL questions. 
 * Supports optional pagination & filters via query params.
 */
export async function GET(request: Request) {
  try {
    console.log("GET /api/questions called at", new Date().toISOString())

    const { searchParams } = new URL(request.url)

    // Pagination
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")
    let skip: number | undefined
    let take: number | undefined

    if (pageParam || pageSizeParam) {
      const page = parseInt(pageParam || "1", 10) || 1
      const pageSize = parseInt(pageSizeParam || "10", 10) || 10
      skip = (page - 1) * pageSize
      take = pageSize
    }

    // Filters
    const examFilter = searchParams.get("exam") || undefined
    const subjectFilter = searchParams.get("subject") || undefined
    const topicFilter = searchParams.get("topic") || undefined
    const subtopicFilter = searchParams.get("subtopic") || undefined
    const difficultyFilter = searchParams.get("difficulty") || undefined
    const yearFilter = searchParams.get("year") || undefined
    const typeFilter = searchParams.get("type") || undefined
    const searchQuery = searchParams.get("search") || undefined

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
      where.year = parseInt(yearFilter, 10)
    }
    if (typeFilter) {
      where.type = typeFilter
    }
    if (searchQuery) {
      where.text = {
        contains: searchQuery,
        mode: "insensitive",
      }
    }

    const questions = await prisma.question.findMany({
      skip,
      take,
      where,
      select: {
        // Keep all the fields you want to return
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
        pyqOutOfSyllabus: true,
        pyqTotal: true,
        pyqPrivate: true,
        pyqPublic: true,
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
        correctAttempts: true,
        wrongAttempts: true,
        averageTimeTaken: true,
        lastAttempted: true,
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

    if (skip !== undefined && take !== undefined) {
      const totalCount = await prisma.question.count({ where })
      const page = skip / take + 1
      return NextResponse.json({
        data: questions,
        currentPage: page,
        pageSize: take,
        totalCount,
      })
    } else {
      return NextResponse.json(questions)
    }
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

/**
 * POST a new question
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const created = await prisma.question.create({
      data: {
        ...data,
        status: data.status || QuestionStatus.ACTIVE,
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}

/**
 * PATCH an existing question
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    const updated = await prisma.question.update({
      where: { questionId },
      data: { ...rest },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

/**
 * DELETE a question
 */
export async function DELETE(request: Request) {
  try {
    const { questionId } = await request.json()
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }
    await prisma.question.delete({ where: { questionId } })
    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}

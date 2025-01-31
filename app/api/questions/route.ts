import { NextResponse } from "next/server"
import { PrismaClient, QuestionStatus } from "@prisma/client"

const prisma = new PrismaClient()

/** 
 * Utility to parse comma-separated query params: 
 *   "JEE,NEET" => ["JEE","NEET"] 
 */
function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * GET /api/questions
 *  ?exam=JEE,NEET
 *  &subject=Physics,Chemistry
 *  &difficulty=Easy,Medium
 *  &year=2021,2022
 *  &page=1
 *  &pageSize=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // 1) Pagination
    const pageParam = searchParams.get("page") || "1"
    const pageSizeParam = searchParams.get("pageSize") || "10"
    const page = parseInt(pageParam, 10) || 1
    const pageSize = parseInt(pageSizeParam, 10) || 10
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 2) Parse multi-value filters
    const examArr       = parseCommaParam(searchParams.get("exam"))
    const subjectArr    = parseCommaParam(searchParams.get("subject"))
    const topicArr      = parseCommaParam(searchParams.get("topic"))
    const subtopicArr   = parseCommaParam(searchParams.get("subtopic"))
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"))
    const yearStrArr    = parseCommaParam(searchParams.get("year"))
    const typeArr       = parseCommaParam(searchParams.get("type"))

    // 3) Build Prisma WHERE object
    const where: any = {
      // If you only want active questions, for example:
      // status: QuestionStatus.ACTIVE
    }

    // exam in [...]
    if (examArr) {
      where.exam = { in: examArr }
    }
    if (subjectArr) {
      where.subject = { in: subjectArr }
    }
    if (topicArr) {
      where.topic = { in: topicArr }
    }
    if (subtopicArr) {
      where.subtopic = { in: subtopicArr }
    }
    if (difficultyArr) {
      where.difficulty = { in: difficultyArr }
    }
    if (typeArr) {
      where.type = { in: typeArr }
    }
    if (yearStrArr) {
      const years = yearStrArr.map((y) => parseInt(y, 10)).filter(Boolean)
      if (years.length) {
        where.year = { in: years }
      }
    }

    // 4) Fetch questions
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        skip,
        take,
        where,
        // e.g. orderBy: { id: "asc" }
      }),
      prisma.question.count({ where }),
    ])

    return NextResponse.json({
      data: questions,
      currentPage: page,
      pageSize,
      totalCount,
    })
  } catch (error) {
    console.error("Error in GET /api/questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

/**
 * POST /api/questions
 * Creates a new question
 * Body example:
 * {
 *   "questionId": "Q123",
 *   "text": "Which of the following is correct?",
 *   "options": ["A) ...", "B) ...", ...],
 *   "correctOption": "A",
 *   "exam": "JEE",
 *   "subject": "Physics",
 *   ...
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("POST /api/questions => creating question", data)

    // Adjust as needed
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
 * PATCH /api/questions
 * Updates an existing question by questionId.
 * Body example:
 * {
 *   "questionId": "Q123",
 *   "completed": true,
 *   "reviewed": false
 * }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    console.log("PATCH /api/questions => updating question", body)

    const { questionId, ...rest } = body
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    const updated = await prisma.question.update({
      where: { questionId },
      data: rest,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

/**
 * DELETE /api/questions
 * Body example:
 * {
 *   "questionId": "Q123"
 * }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    console.log("DELETE /api/questions => removing question", body)

    const { questionId } = body
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

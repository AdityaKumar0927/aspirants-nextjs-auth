import { NextResponse } from "next/server"
import { PrismaClient, QuestionStatus } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/questions
 * 
 * Example usage:
 *  /api/questions?exam=JEE&subject=Physics&difficulty=Medium&year=2021&page=1&pageSize=20
 * 
 * Returns:
 * {
 *   data: [...some subset of questions...],
 *   currentPage: 1,
 *   pageSize: 20,
 *   totalCount: 123
 * }
 * 
 * If no page or pageSize, returns the entire array (non-paginated).
 */
export async function GET(request: Request) {
  try {
    console.log("GET /api/questions => paginated + filters")

    const { searchParams } = new URL(request.url)

    // 1) Extract page & pageSize from query
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")

    let skip: number | undefined
    let take: number | undefined

    if (pageParam || pageSizeParam) {
      const page = parseInt(pageParam || "1", 10) || 1
      const pageSize = parseInt(pageSizeParam || "10", 10) || 10
      skip = (page - 1) * pageSize
      take = pageSize
      console.log(`Pagination => page=${page}, pageSize=${pageSize}, skip=${skip}, take=${take}`)
    }

    // 2) Extract filter fields from query (adjust to your schema)
    const examFilter = searchParams.get("exam") || undefined
    const subjectFilter = searchParams.get("subject") || undefined
    const difficultyFilter = searchParams.get("difficulty") || undefined
    const yearFilter = searchParams.get("year") || undefined

    // 3) Build the 'where' object for Prisma
    const where: any = {}
    if (examFilter) {
      where.exam = examFilter
    }
    if (subjectFilter) {
      where.subject = subjectFilter
    }
    if (difficultyFilter) {
      where.difficulty = difficultyFilter
    }
    if (yearFilter) {
      where.year = parseInt(yearFilter, 10)
    }

    // 4) Fetch questions with optional skip/take
    const questions = await prisma.question.findMany({
      skip,
      take,
      where,
      // If you only want certain columns, do:
      // select: { questionId: true, text: true, exam: true, ... },
    })

    // 5) If we used pagination, return the totalCount as well
    if (skip !== undefined && take !== undefined) {
      const totalCount = await prisma.question.count({ where })
      const currentPage = skip / take + 1

      return NextResponse.json({
        data: questions,
        currentPage,
        pageSize: take,
        totalCount,
      })
    } else {
      // If no skip/take, return entire array of questions
      return NextResponse.json(questions)
    }
  } catch (error) {
    console.error("Error in GET /api/questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

/**
 * POST /api/questions
 * Creates a new question. 
 * 
 * Expect the request body (JSON) to have fields for exam, subject, text, etc.
 * Example:
 * {
 *   "questionId": "someUniqueId",
 *   "text": "A sample question text",
 *   "exam": "JEE",
 *   "subject": "Physics",
 *   ...
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("POST /api/questions => creating question", data)

    // If needed, parse arrays or do validation here
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
 * Expect JSON body: { questionId, ...fieldsToUpdate }
 * 
 * Example:
 * {
 *   "questionId": "someUniqueId",
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

    // update the question
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
 * DELETE /api/questions
 * Expects JSON body { questionId: "someId" }
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

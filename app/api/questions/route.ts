import { NextResponse } from "next/server"
import { PrismaClient, QuestionStatus } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    console.log("GET /api/questions => Checking for ?page & ?pageSize.")
    const { searchParams } = new URL(request.url)

    // Pull out pagination
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

    // If you want to read filters from query, do so:
    const examFilter = searchParams.get("exam") || undefined
    const subjectFilter = searchParams.get("subject") || undefined
    const difficultyFilter = searchParams.get("difficulty") || undefined
    // etc. for topic, subtopic, year...

    // Build a 'where' object for Prisma
    const where: any = {}
    if (examFilter) where.exam = examFilter
    if (subjectFilter) where.subject = subjectFilter
    if (difficultyFilter) where.difficulty = difficultyFilter

    // Actually fetch from DB
    const questions = await prisma.question.findMany({
      skip,
      take,
      where,
      // select: { ... } to limit fields if you want
    })

    // If we did skip/take, also return totalCount
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
      // no pagination => return entire array
      return NextResponse.json(questions)
    }
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

// For completeness, any patch logic:
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

import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * GET /api/questions/stats
 * e.g. /api/questions/stats?exam=JEE,NEET&subject=Physics&year=2022
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const examArr       = parseCommaParam(searchParams.get("exam"))
    const subjectArr    = parseCommaParam(searchParams.get("subject"))
    const topicArr      = parseCommaParam(searchParams.get("topic"))
    const subtopicArr   = parseCommaParam(searchParams.get("subtopic"))
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"))
    const typeArr       = parseCommaParam(searchParams.get("type"))
    const yearStrArr    = parseCommaParam(searchParams.get("year"))

    const where: any = {}

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

    // total
    const total = await prisma.question.count({ where })

    // completed
    const completed = await prisma.question.count({
      where: { ...where, completed: true },
    })

    // reviewed
    const reviewed = await prisma.question.count({
      where: { ...where, reviewed: true },
    })

    // notAnswered
    const notAnswered = total - completed

    return NextResponse.json({
      total,
      completed,
      reviewed,
      notAnswered,
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}

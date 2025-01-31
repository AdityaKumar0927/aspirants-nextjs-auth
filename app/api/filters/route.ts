import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

/**
 * GET /api/filters
 * Returns all distinct exams, subjects, topics, subtopics, difficulties, years, types
 * 
 * Usage: /api/filters
 */
export async function GET() {
  try {
    // distinct fields from question table
    const [exams, subjects, topics, subtopics, difficulties, years, types] = await Promise.all([
      prisma.question.findMany({ distinct: ["exam"], select: { exam: true } }),
      prisma.question.findMany({ distinct: ["subject"], select: { subject: true } }),
      prisma.question.findMany({ distinct: ["topic"], select: { topic: true } }),
      prisma.question.findMany({ distinct: ["subtopic"], select: { subtopic: true } }),
      prisma.question.findMany({ distinct: ["difficulty"], select: { difficulty: true } }),
      prisma.question.findMany({ distinct: ["year"], select: { year: true } }),
      prisma.question.findMany({ distinct: ["type"], select: { type: true } }),
    ])

    // For each array, define the param type in .map, then filter out null
    const examList = exams
      .map((e: { exam: string | null }) => e.exam)
      .filter((val: string | null): val is string => !!val)

    const subjectList = subjects
      .map((s: { subject: string | null }) => s.subject)
      .filter((val: string | null): val is string => !!val)

    const topicList = topics
      .map((t: { topic: string | null }) => t.topic)
      .filter((val: string | null): val is string => !!val)

    const subtopicList = subtopics
      .map((st: { subtopic: string | null }) => st.subtopic)
      .filter((val: string | null): val is string => !!val)

    const difficultyList = difficulties
      .map((d: { difficulty: string | null }) => d.difficulty)
      .filter((val: string | null): val is string => !!val)

    const yearList = years
      .map((y: { year: number | null }) => y.year)
      .filter((val: number | null): val is number => val !== null)
      .map((num: number) => num.toString())

    const typeList = types
      .map((ty: { type: string | null }) => ty.type)
      .filter((val: string | null): val is string => !!val)

    return NextResponse.json({
      exams: examList,
      subjects: subjectList,
      topics: topicList,
      subtopics: subtopicList,
      difficulties: difficultyList,
      years: yearList,
      types: typeList,
    })
  } catch (error) {
    console.error("Error in GET /api/filters:", error)
    return NextResponse.json({ error: "Failed to fetch distinct filters" }, { status: 500 })
  }
}

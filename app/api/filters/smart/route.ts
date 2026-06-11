import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { cached } from "@/lib/cache"

function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * GET /api/filters/smart
 * e.g. /api/filters/smart?exam=JEE,NEET&subject=Physics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const examArr = parseCommaParam(searchParams.get("exam"))
    const subjectArr = parseCommaParam(searchParams.get("subject"))
    const topicArr = parseCommaParam(searchParams.get("topic"))
    const subtopicArr = parseCommaParam(searchParams.get("subtopic"))
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"))
    const yearStrArr = parseCommaParam(searchParams.get("year"))
    const typeArr = parseCommaParam(searchParams.get("type"))

    const where: any = {}
    where.status = "ACTIVE"
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
      const years = yearStrArr.map((y) => parseInt(y, 10)).filter((n) => !Number.isNaN(n))
      if (years.length) {
        where.year = { in: years }
      }
    }

    // Distinct fields from only the matching set. Cached per filter combination
    // for 60s. Key off a NORMALIZED (sorted) representation so semantically
    // equal filter sets (e.g. "JEE,NEET" vs "NEET,JEE") share a cache entry.
    const norm = (a?: string[]) => (a ? [...a].sort().join(",") : "")
    const cacheKey =
      "filters:smart:" +
      [examArr, subjectArr, topicArr, subtopicArr, difficultyArr, yearStrArr, typeArr]
        .map(norm)
        .join("|")
    const [exams, subjects, topics, subtopics, difficulties, years, types] = await cached(
      cacheKey,
      60_000,
      () =>
        Promise.all([
          prisma.question.findMany({ where, distinct: ["exam"], select: { exam: true } }),
          prisma.question.findMany({ where, distinct: ["subject"], select: { subject: true } }),
          prisma.question.findMany({ where, distinct: ["topic"], select: { topic: true } }),
          prisma.question.findMany({ where, distinct: ["subtopic"], select: { subtopic: true } }),
          prisma.question.findMany({ where, distinct: ["difficulty"], select: { difficulty: true } }),
          prisma.question.findMany({ where, distinct: ["year"], select: { year: true } }),
          prisma.question.findMany({ where, distinct: ["type"], select: { type: true } }),
        ])
    )

    // Now we map each array with typed callbacks:
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
      .map((val: number) => val.toString()) // convert to string

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
  } catch (err) {
    console.error("Error in GET /api/filters/smart:", err)
    return NextResponse.json({ error: "Failed to fetch smart filters" }, { status: 500 })
  }
}

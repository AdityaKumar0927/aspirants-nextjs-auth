import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

/**
 * GET /api/filters
 * Returns all distinct exams, subjects, topics, subtopics, difficulties, years, types
 * AND now also customTags.
 *
 * Usage: /api/filters
 */
export async function GET() {
  try {
    // 1) Distinct fields from the 'question' table
    const [exams, subjects, topics, subtopics, difficulties, years, types, customTagRows] =
      await Promise.all([
        prisma.question.findMany({
          distinct: ["exam"],
          select: { exam: true },
          where: { exam: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["subject"],
          select: { subject: true },
          where: { subject: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["topic"],
          select: { topic: true },
          where: { topic: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["subtopic"],
          select: { subtopic: true },
          where: { subtopic: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["difficulty"],
          select: { difficulty: true },
          where: { difficulty: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["year"],
          select: { year: true },
          where: { year: { not: null } },
        }),
        prisma.question.findMany({
          distinct: ["type"],
          select: { type: true },
          where: { type: { not: null } },
        }),
        // 2) Distinct customTag CSV strings:
        prisma.question.findMany({
          distinct: ["customTag"],
          select: { customTag: true },
          where: { customTag: { not: null } },
        }),
      ])

    // 3) Map each array and filter out null
    const examList = exams
      .map((e) => e.exam)
      .filter((val): val is string => !!val)

    const subjectList = subjects
      .map((s) => s.subject)
      .filter((val): val is string => !!val)

    const topicList = topics
      .map((t) => t.topic)
      .filter((val): val is string => !!val)

    const subtopicList = subtopics
      .map((st) => st.subtopic)
      .filter((val): val is string => !!val)

    const difficultyList = difficulties
      .map((d) => d.difficulty)
      .filter((val): val is string => !!val)

    const yearList = years
      .map((y) => y.year)
      .filter((val): val is number => val !== null)
      .map((num) => num.toString())

    const typeList = types
      .map((ty) => ty.type)
      .filter((val): val is string => !!val)

    // 4) Flatten the CSV tags from each row of `customTag`
    const tagSet = new Set<string>()
    for (const row of customTagRows) {
      if (row.customTag) {
        // e.g. "tag1, tag2"
        const tags = row.customTag.split(",")
        for (const t of tags) {
          const trimmed = t.trim()
          if (trimmed) {
            tagSet.add(trimmed)
          }
        }
      }
    }
    const customTags = Array.from(tagSet)

    return NextResponse.json({
      exams: examList,
      subjects: subjectList,
      topics: topicList,
      subtopics: subtopicList,
      difficulties: difficultyList,
      years: yearList,
      types: typeList,
      // 5) Return the distinct custom tags
      customTags,
    })
  } catch (error) {
    console.error("Error in GET /api/filters:", error)
    return NextResponse.json({ error: "Failed to fetch distinct filters" }, { status: 500 })
  }
}

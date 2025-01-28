import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/exams-and-years
 *
 * Cases:
 * 1) No query => return distinct exams: { exams: [...] }
 * 2) ?exam=EXAM_NAME => return years for that exam: { years: [...] }
 * 3) ?exam=EXAM_NAME&year=YYYY => return shifts for that exam+year: { shifts: [...] }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examParam = searchParams.get("exam") // e.g. "JEE"
    const yearParam = searchParams.get("year") // e.g. "2022"

    // 1) If no examParam => just return distinct exams
    if (!examParam) {
      const rows = await prisma.question.findMany({
        distinct: ["exam"],
        where: { exam: { not: null } },
        select: { exam: true },
      })
      const exams = rows.map(r => r.exam!).filter(Boolean)
      return NextResponse.json({ exams })
    }

    // 2) If we have examParam but no yearParam => return distinct years for that exam
    if (examParam && !yearParam) {
      const rows = await prisma.question.findMany({
        distinct: ["year"],
        where: { 
          exam: examParam,
          year: { not: null },
        },
        select: { year: true },
      })
      const years = rows.map(r => r.year!).filter(Boolean)
      return NextResponse.json({ years })
    }

    // 3) If we have examParam + yearParam => return distinct shifts (keys) for that exam+year
    if (examParam && yearParam) {
      const parsedYear = parseInt(yearParam, 10)
      const rows = await prisma.question.findMany({
        distinct: ["key"],
        where: {
          exam: examParam,
          year: parsedYear,
          key: { not: null },
        },
        select: { key: true },
      })
      const shifts = rows.map(r => r.key!).filter(Boolean)
      return NextResponse.json({ shifts })
    }

    // Should never get here, but in case:
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  } catch (error) {
    console.error("Error in GET /api/exams-and-years:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

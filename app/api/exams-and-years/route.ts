import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/exams-and-years
 * Returns an object with all unique exams, years, and shifts (paperId).
 *
 * Shape:
 * {
 *   exams: ["JEE-Main", "NEET", ...],
 *   years: [2020, 2021, ...],
 *   shifts: ["Shift-1", "Shift-2", ...]
 * }
 */
export async function GET() {
  try {
    // Fetch unique exam, year, and paperId from "Question"
    const [examsRaw, yearsRaw, shiftsRaw] = await Promise.all([
      prisma.question.findMany({
        distinct: ["exam"],
        where: { exam: { not: null } },
        select: { exam: true },
      }),
      prisma.question.findMany({
        distinct: ["year"],
        where: { year: { not: null } },
        select: { year: true },
      }),
      prisma.question.findMany({
        distinct: ["paperId"],
        where: { paperId: { not: null } },
        select: { paperId: true },
      }),
    ])

    const exams = examsRaw.map((x) => x.exam).filter(Boolean)
    const years = yearsRaw.map((x) => x.year).filter(Boolean)
    const shifts = shiftsRaw.map((x) => x.paperId).filter(Boolean)

    return NextResponse.json({ exams, years, shifts })
  } catch (error) {
    console.error("Error fetching exams, years, shifts:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

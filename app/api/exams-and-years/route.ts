// /app/api/exams-and-years/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/exams-and-years
 * Returns { exams: string[], years: number[], shifts: string[] }.
 * The "shifts" array is actually the distinct "key" values from Question.
 */
export async function GET() {
  try {
    // Distinct "exam", "year", and "key"
    const [examRows, yearRows, keyRows] = await Promise.all([
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
        distinct: ["key"],
        where: { key: { not: null } },
        select: { key: true },
      }),
    ])

    const exams = examRows.map((row) => row.exam).filter(Boolean) as string[]
    const years = yearRows.map((row) => row.year).filter(Boolean) as number[]
    const shifts = keyRows.map((row) => row.key).filter(Boolean) as string[]

    return NextResponse.json({ exams, years, shifts })
  } catch (error) {
    console.error("Error fetching exam/year/shift data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examParam = searchParams.get("exam") // e.g. "jee-main"
    const yearParam = searchParams.get("year") // e.g. "2024"

    // 1) If no exam => distinct exam
    if (!examParam) {
      const rows = await prisma.question.findMany({
        distinct: ["exam"],
        where: { exam: { not: null } },
        select: { exam: true },
      })

      const exams = rows
        .map((r) => r.exam)
        .filter((exam): exam is string => !!exam)
        .sort((a, b) => a.localeCompare(b))

      return NextResponse.json({ exams })
    }

    // 2) If exam but no year => distinct years
    if (examParam && !yearParam) {
      const rows = await prisma.question.findMany({
        distinct: ["year"],
        where: {
          exam: examParam,
          year: { not: null },
        },
        select: { year: true },
      })

      const years = rows
        .map((r) => r.year)
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b)

      return NextResponse.json({ years })
    }

    // 3) If exam + year => distinct "yearKey" => shifts
    if (examParam && yearParam) {
      const parsedYear = parseInt(yearParam, 10)
      if (isNaN(parsedYear)) {
        return NextResponse.json({ shifts: [] })
      }

      const rows = await prisma.question.findMany({
        distinct: ["yearKey"],
        where: {
          exam: examParam,
          year: parsedYear,
          yearKey: { not: null },
        },
        select: { yearKey: true },
      })

      const shifts = rows
        .map((r) => r.yearKey)
        .filter((k): k is string => !!k)
        .sort((a, b) => a.localeCompare(b))

      return NextResponse.json({ shifts })
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  } catch (err: unknown) {
    console.error("GET /api/exams-and-years =>", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

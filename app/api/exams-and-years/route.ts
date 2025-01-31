import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examParam = searchParams.get("exam")
    const yearParam = searchParams.get("year")

    // 1) No exam => distinct exam
    if (!examParam) {
      // Each row is { exam: string | null }
      const rows = await prisma.question.findMany({
        distinct: ["exam"],
        where: { exam: { not: null } },
        select: { exam: true },
      })

      // We'll handle the type inline
      // Then filter out null, map to string, and sort by locale
      const exams = rows
        .map((r: { exam: string | null }) => r.exam)
        .filter((exam: string | null): exam is string => !!exam)
        .sort((a: string, b: string) => a.localeCompare(b))

      return NextResponse.json({ exams })
    }

    // 2) exam but no year => distinct years
    if (examParam && !yearParam) {
      // Each row is { year: number | null }
      const rows = await prisma.question.findMany({
        distinct: ["year"],
        where: {
          exam: examParam,
          year: { not: null },
        },
        select: { year: true },
      })

      // filter out null
      const years = rows
        .map((r: { year: number | null }) => r.year)
        .filter((y: number | null): y is number => y !== null)
        .sort((a: number, b: number) => a - b)

      return NextResponse.json({ years })
    }

    // 3) exam + year => distinct key => shifts
    if (examParam && yearParam) {
      const parsedYear = parseInt(yearParam, 10)
      if (isNaN(parsedYear)) {
        return NextResponse.json({ shifts: [] })
      }

      // Each row is { key: string | null }
      const rows = await prisma.question.findMany({
        distinct: ["key"],
        where: {
          exam: examParam,
          year: parsedYear,
          key: { not: null },
        },
        select: { key: true },
      })

      const shifts = rows
        .map((r: { key: string | null }) => r.key)
        .filter((k: string | null): k is string => !!k)
        .sort((a: string, b: string) => a.localeCompare(b))

      return NextResponse.json({ shifts })
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  } catch (err: unknown) {
    console.error("GET /api/exams-and-years =>", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

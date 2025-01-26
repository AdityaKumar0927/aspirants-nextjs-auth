import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("GET /api/filters => fetching distinct exam, subject, difficulty, year")

    // 1) Distinct exams
    const examRows = await prisma.question.findMany({
      distinct: ["exam"],
      where: { exam: { not: null } },
      select: { exam: true },
    })
    const exams = examRows.map((row) => row.exam).filter(Boolean)

    // 2) Distinct subjects
    const subjectRows = await prisma.question.findMany({
      distinct: ["subject"],
      where: { subject: { not: null } },
      select: { subject: true },
    })
    const subjects = subjectRows.map((row) => row.subject).filter(Boolean)

    // 3) Distinct difficulties
    const diffRows = await prisma.question.findMany({
      distinct: ["difficulty"],
      where: { difficulty: { not: null } },
      select: { difficulty: true },
    })
    const difficulties = diffRows.map((row) => row.difficulty).filter(Boolean)

    // 4) Distinct years
    const yearRows = await prisma.question.findMany({
      distinct: ["year"],
      where: { year: { not: null } },
      select: { year: true },
    })
    const years = yearRows.map((row) => row.year).filter(Boolean)

    return NextResponse.json({
      exams,
      subjects,
      difficulties,
      years,
    })
  } catch (err) {
    console.error("Error in GET /api/filters:", err)
    return NextResponse.json({ error: "Failed to fetch filter data" }, { status: 500 })
  }
}

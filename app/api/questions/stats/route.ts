import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const totalQuestions = await prisma.question.count()
    const exams = await prisma.question.groupBy({
      by: ["exam"],
      _count: true,
    })
    const chapterGroups = await prisma.question.groupBy({
      by: ["chapterGroup"],
      _count: true,
    })
    const topics = await prisma.question.groupBy({
      by: ["topic"],
      _count: true,
    })
    const subtopics = await prisma.question.groupBy({
      by: ["subtopic"],
      _count: true,
    })

    return NextResponse.json({
      totalQuestions,
      uniqueExams: exams.length,
      uniqueChapterGroups: chapterGroups.length,
      uniqueTopics: topics.length,
      uniqueSubtopics: subtopics.length,
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}


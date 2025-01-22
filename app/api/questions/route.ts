import { PrismaClient, Prisma, QuestionStatus } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

// GET all questions
export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      select: {
        // Basic question identity
        questionId: true,
        examGroup: true,
        country: true,
        exam: true,
        key: true,
        date: true,
        description: true,
        isMemoryBased: true,
        isOnline: true,
        languages: true,
        title: true,
        year: true,

        // PYQ fields
        pyqOutOfSyllabus: true,
        pyqTotal: true,
        pyqPrivate: true,
        pyqPublic: true,

        // Syllabus group
        examId: true,
        subjectGroup: true,
        chapterGroup: true,
        chapter: true,
        topicName: true,
        examDate: true,
        content: true,
        permalink: true,
        paperId: true,
        isOutOfSyllabus: true,
        isBonus: true,

        // Core question data
        text: true,
        subject: true,
        topic: true,
        subtopic: true,
        difficulty: true,
        type: true,
        marks: true,
        negMarks: true,
        options: true,
        correctOption: true,
        markscheme: true,

        // Attempts & stats
        correctAttempts: true,
        wrongAttempts: true,
        averageTimeTaken: true,
        lastAttempted: true,

        // Extra question metadata
        diagramUrl: true,
        customTag: true,
        explanation: true,
        reviewed: true,
        completed: true,
        paperTitle: true,
        timeAllotted: true,
        updatedTime: true,
        updatedBy: true,
        source: true,
        peerSolvedPercentage: true,
        linkedResources: true,
        commonMistakes: true,
        discussionLink: true,
        parentQuestionId: true,
        difficultyRating: true,
        yearKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Parse JSON fields
    const parsedQuestions = questions.map((q) => ({
      ...q,
      languages: q.languages ? q.languages : [],
      explanation: q.explanation ? JSON.parse(q.explanation as string) : null,
      linkedResources: q.linkedResources ? JSON.parse(q.linkedResources as string) : null,
      commonMistakes: q.commonMistakes ? JSON.parse(q.commonMistakes as string) : null,
    }))

    return NextResponse.json(parsedQuestions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

// POST a new question
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Map difficultyRating to difficulty string
    if (data.difficultyRating !== undefined) {
      if (data.difficultyRating === 1) data.difficulty = "easy"
      else if (data.difficultyRating === 2) data.difficulty = "medium"
      else if (data.difficultyRating === 3) data.difficulty = "hard"
    }

    // If status not provided, default to ACTIVE
    const status = data.status || QuestionStatus.ACTIVE

    // Handle nested JSON fields
    const questionData = {
      ...data,
      status,
      languages: data.languages || [],
      explanation: data.explanation ? JSON.stringify(data.explanation) : null,
      linkedResources: data.linkedResources ? JSON.stringify(data.linkedResources) : null,
      commonMistakes: data.commonMistakes ? JSON.stringify(data.commonMistakes) : null,
      updatedTime: Math.floor(Date.now() / 1000),
    }

    const created = await prisma.question.create({
      data: questionData,
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}

// PATCH an existing question
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    // If the user updated difficultyRating, also set difficulty string
    if (rest.difficultyRating !== undefined) {
      const rating = Number(rest.difficultyRating)
      if (rating === 1) rest.difficulty = "easy"
      else if (rating === 2) rest.difficulty = "medium"
      else if (rating === 3) rest.difficulty = "hard"
    }

    // Set updatedTime to now
    rest.updatedTime = Math.floor(Date.now() / 1000)

    // If we want to cast rest.status -> enum, do so carefully
    if (rest.status) {
      if (!Object.values(QuestionStatus).includes(rest.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      // rest.status is a valid QuestionStatus
    }

    // Handle nested JSON fields
    const updateData: any = { ...rest }
    if (rest.languages) updateData.languages = rest.languages
    if (rest.explanation) updateData.explanation = JSON.stringify(rest.explanation)
    if (rest.linkedResources) updateData.linkedResources = JSON.stringify(rest.linkedResources)
    if (rest.commonMistakes) updateData.commonMistakes = JSON.stringify(rest.commonMistakes)

    // Update the question
    const updated = await prisma.question.update({
      where: { questionId },
      data: updateData,
    })

    // Parse JSON fields for response
    const parsedUpdated = {
      ...updated,
      languages: updated.languages || [],
      explanation: updated.explanation ? JSON.parse(updated.explanation as string) : null,
      linkedResources: updated.linkedResources ? JSON.parse(updated.linkedResources as string) : null,
      commonMistakes: updated.commonMistakes ? JSON.parse(updated.commonMistakes as string) : null,
    }

    return NextResponse.json(parsedUpdated)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

// DELETE a question
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get("questionId")

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    await prisma.question.delete({
      where: { questionId },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}


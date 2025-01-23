// /api/questions/route.ts
import { PrismaClient, Prisma, QuestionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET all questions
export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      select: {
        // Include everything you might want in your front-end Question interface
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
        pyqOutOfSyllabus: true,
        pyqTotal: true,
        pyqPrivate: true,
        pyqPublic: true,
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
        correctAttempts: true,
        wrongAttempts: true,
        averageTimeTaken: true,
        lastAttempted: true,
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
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

// POST a new question
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // If you have arrays or related data, handle them properly. 
    // E.g. if data.notes is an array of { title, content }, etc.
    const created = await prisma.question.create({
      data: {
        ...data,
        // If status not provided, default to ACTIVE or DRAFT, as you wish
        status: data.status || QuestionStatus.ACTIVE,
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}

// PATCH an existing question
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { questionId, ...rest } = body

    // You can optionally cast `rest.status` to QuestionStatus if it’s provided
    //   e.g.: rest.status ? rest.status as QuestionStatus : undefined
    const updated = await prisma.question.update({
      where: { questionId },
      data: {
        ...rest,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

// DELETE a question
export async function DELETE(request: Request) {
  try {
    const { questionId } = await request.json()

    await prisma.question.delete({
      where: { questionId },
    })

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
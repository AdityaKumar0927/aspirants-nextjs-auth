import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSession } from "@/lib/auth"

/**
 * GET /api/mock-exams/:attemptId
 * Returns the single attempt if it belongs to the logged in user
 */
export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { session, response } = await requireSession()
  if (response) return response
  try {
    const userId = session.user.id
    const attemptId = (await params).attemptId

    const attempt = await prisma.userMockExam.findUnique({
      where: { id: attemptId },
    })
    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (attempt.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ data: attempt })
  } catch (err) {
    console.error("GET /api/mock-exams/[id] =>", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

/**
 * PATCH /api/mock-exams/:attemptId
 * Updates an existing attempt (e.g. to store final results)
 * Body example:
 * {
 *   "results": {...some updated JSON...},
 *   "completed": true
 * }
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { session, response } = await requireSession()
  if (response) return response
  try {
    const userId = session.user.id
    const attemptId = (await params).attemptId

    const attempt = await prisma.userMockExam.findUnique({
      where: { id: attemptId },
    })
    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (attempt.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const updated = await prisma.userMockExam.update({
      where: { id: attemptId },
      data: {
        results: body.results,
        completed: body.completed ?? attempt.completed,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("PATCH /api/mock-exams/[id] =>", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

/**
 * DELETE /api/mock-exams/:attemptId
 * Remove a single attempt
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { session, response } = await requireSession()
  if (response) return response
  try {
    const userId = session.user.id
    const attemptId = (await params).attemptId

    const attempt = await prisma.userMockExam.findUnique({
      where: { id: attemptId },
    })
    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (attempt.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.userMockExam.delete({ where: { id: attemptId } })
    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err) {
    console.error("DELETE /api/mock-exams/[id] =>", err)
    return NextResponse.json({ error: "Failed to delete attempt" }, { status: 500 })
  }
}

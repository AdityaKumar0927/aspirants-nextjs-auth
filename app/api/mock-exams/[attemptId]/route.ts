import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"

// PATCH mirrors the POST in ../route.ts: bound the results blob so it can't
// bloat the Json column, and coerce completed to a strict boolean.
const patchSchema = z.object({
  completed: z.boolean().optional(),
  results: z
    .unknown()
    .optional()
    .refine(
      (v) => v === undefined || v === null || JSON.stringify(v).length <= 200_000,
      "results payload too large"
    ),
})

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

    const csrf = assertSameOrigin(request); if (csrf) return csrf;
    const limited = await rateLimit(request, "mock-exam-attempt", { limit: 60, windowSec: 60 }, session.user.id); if (limited) return limited;

    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { results, completed } = parsed.data

    const updated = await prisma.userMockExam.update({
      where: { id: attemptId },
      data: {
        results: results as object | undefined,
        completed: completed ?? attempt.completed,
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

    const csrf = assertSameOrigin(request); if (csrf) return csrf;
    const limited = await rateLimit(request, "mock-exam-attempt", { limit: 60, windowSec: 60 }, session.user.id); if (limited) return limited;

    await prisma.userMockExam.delete({ where: { id: attemptId } })
    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err) {
    console.error("DELETE /api/mock-exams/[id] =>", err)
    return NextResponse.json({ error: "Failed to delete attempt" }, { status: 500 })
  }
}

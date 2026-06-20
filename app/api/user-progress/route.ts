import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession } from "@/lib/auth"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"
import { assertWritable } from "@/lib/admin-controls"

const postSchema = z.object({
  questionId: z.string().min(1),
  completed: z.boolean().optional(),
  reviewed: z.boolean().optional(),
  lastAttempted: z.coerce.date().optional(),
})

export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response
  try {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json(userProgress)
  } catch (error) {
    console.error("Error fetching user progress:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireSession()
  if (response) return response

  const csrf = assertSameOrigin(request)
  if (csrf) return csrf
  const limited = await rateLimit(request, "user-progress", { limit: 120, windowSec: 60 }, session.user.id)
  if (limited) return limited
  const ro = await assertWritable()
  if (ro) return ro

  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { questionId, completed, reviewed, lastAttempted } = parsed.data
    const data = await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: {
        completed,
        reviewed,
        lastAttempted: lastAttempted ?? null,
      },
      create: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        questionId,
        completed,
        reviewed,
        lastAttempted: lastAttempted ?? null,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating user progress:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

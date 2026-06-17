import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import prisma from "@/lib/prisma"
import authOptions from "../auth/[...nextauth]/options"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"
import { containsProfanity, PROFANITY_ERROR } from "@/lib/profanity"

const feedbackSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  emoji: z.string().max(16).optional(),
  anonymous: z.boolean().optional(),
})

/** GET /api/feedback — the signed-in user's own feedback history + threads. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items = await prisma.feedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      emoji: true,
      status: true,
      anonymous: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, fromAdmin: true, content: true, createdAt: true },
      },
    },
  })

  const res = NextResponse.json(items)
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limited = await rateLimit(request, "feedback", { limit: 6, windowSec: 300 }, session.user.id)
    if (limited) return limited

    const parsed = feedbackSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 })
    }
    const { content, emoji, anonymous } = parsed.data

    if (containsProfanity(content)) {
      return NextResponse.json({ error: PROFANITY_ERROR }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        emoji,
        anonymous: anonymous === true,
        userId: session.user.id,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import authOptions from "../auth/[...nextauth]/options"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"

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

    const { content, emoji, anonymous } = await request.json()
    if (!content) {
      return NextResponse.json({ error: "Feedback content is required" }, { status: 400 })
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

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import authOptions from "../auth/[...nextauth]/options"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"

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

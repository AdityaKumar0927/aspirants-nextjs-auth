import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import authOptions from "../auth/[...nextauth]/options"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

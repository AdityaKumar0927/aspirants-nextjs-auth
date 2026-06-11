import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, completed, reviewed, lastAttempted } = await request.json()
    if (!questionId || typeof questionId !== "string") return NextResponse.json({ error: "questionId is required" }, { status: 400 })
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
        lastAttempted: lastAttempted ? new Date(lastAttempted) : null,
      },
      create: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        questionId,
        completed,
        reviewed,
        lastAttempted: lastAttempted ? new Date(lastAttempted) : null,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating user progress:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

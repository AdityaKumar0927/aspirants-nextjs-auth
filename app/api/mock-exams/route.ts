import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth" // or your auth method

const prisma = new PrismaClient()

/**
 * GET /api/mock-exams
 * Returns all mock exam attempts for the currently logged-in user.
 */
export async function GET() {
  try {
    // e.g. get user from session
    // (adjust to your setup if you have a custom auth)
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const userId = session.user.id

    // fetch all attempts
    const attempts = await prisma.userMockExam.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: attempts })
  } catch (err) {
    console.error("GET /api/mock-exams =>", err)
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 })
  }
}

/**
 * POST /api/mock-exams
 * Creates a new userMockExam record
 * Body example:
 * {
 *   "exam": "JEE",
 *   "year": 2024,
 *   "shift": "morning",
 *   "results": { ...some final exam JSON... }
 *   "completed": true
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const { exam, year, shift, results, completed } = body

    const created = await prisma.userMockExam.create({
      data: {
        userId,
        exam: exam || null,
        year: year || null,
        shift: shift || null,
        results: results || undefined,
        completed: completed ?? false,
      },
    })

    return NextResponse.json({ data: created })
  } catch (err) {
    console.error("POST /api/mock-exams =>", err)
    return NextResponse.json({ error: "Failed to create mock exam attempt" }, { status: 500 })
  }
}

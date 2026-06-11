import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireSession } from "@/lib/auth"

const createSchema = z.object({
  exam: z.string().trim().max(200).nullish(),
  shift: z.string().trim().max(100).nullish(),
  year: z.coerce.number().int().min(1900).max(2100).nullish(),
  completed: z.boolean().optional(),
  // Client-computed results blob — bounded so it can't bloat the Json column.
  results: z
    .unknown()
    .optional()
    .refine(
      (v) => v === undefined || v === null || JSON.stringify(v).length <= 200_000,
      "results payload too large"
    ),
})

/**
 * GET /api/mock-exams
 * Returns all mock exam attempts for the currently logged-in user.
 */
export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response
  try {
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
  const { session, response } = await requireSession()
  if (response) return response
  try {
    const userId = session.user.id

    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { exam, year, shift, results, completed } = parsed.data

    const created = await prisma.userMockExam.create({
      data: {
        userId,
        exam: exam ?? null,
        year: year ?? null,
        shift: shift ?? null,
        results: (results ?? undefined) as object | undefined,
        completed: completed ?? false,
      },
    })

    return NextResponse.json({ data: created })
  } catch (err) {
    console.error("POST /api/mock-exams =>", err)
    return NextResponse.json({ error: "Failed to create mock exam attempt" }, { status: 500 })
  }
}

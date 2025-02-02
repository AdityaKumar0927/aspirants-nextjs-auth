import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/questions/[questionId]/solutions
 * Returns all solutions (and nested replies) for a given question
 */
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params

    // 1) Fetch all "Solution" rows for this question
    const solutions = await prisma.solution.findMany({
      where: {
        questionId,
        parentId: null, // only top-level solutions
      },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          include: {
            replies: true, // If you want to nest multiple levels
          },
        },
      },
    })

    return NextResponse.json(solutions)
  } catch (error) {
    console.error("GET solutions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/questions/[questionId]/solutions
 * Create a new solution or reply
 * Body example:
 * {
 *   "content": "<p>My solution here!</p>",
 *   "authorId": "abc-123",   // optional
 *   "parentId": "someOtherSolutionId" // if it's a reply
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params
    const body = await request.json()

    const { content, parentId, authorId } = body

    // Basic checks
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      )
    }

    // 2) Create new solution
    const newSolution = await prisma.solution.create({
      data: {
        questionId,
        content,
        parentId: parentId || null,
        authorId: authorId || null,
      },
    })

    return NextResponse.json(newSolution)
  } catch (error) {
    console.error("POST solution error:", error)
    return NextResponse.json(
      { error: "Failed to create solution" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/questions/[questionId]/solutions
 * For liking or editing solutions
 * Body example:
 * {
 *   "solutionId": "abc-123",
 *   "like": true
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params
    const body = await request.json()
    const { solutionId, like } = body

    if (!solutionId) {
      return NextResponse.json(
        { error: "solutionId is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.solution.findUnique({ where: { id: solutionId } })
    if (!existing) {
      return NextResponse.json(
        { error: "Solution not found" },
        { status: 404 }
      )
    }

    // If "like" is passed, increment likes
    if (like) {
      const updated = await prisma.solution.update({
        where: { id: solutionId },
        data: {
          likes: existing.likes + 1,
        },
      })
      return NextResponse.json(updated)
    }

    // If you have other logic like updating content, etc. 
    // For brevity, let's just handle 'like' here.

    return NextResponse.json({ message: "Nothing to update" })
  } catch (error) {
    console.error("PATCH solution error:", error)
    return NextResponse.json(
      { error: "Failed to update solution" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/questions/[questionId]/solutions
 * Body example:
 * {
 *   "solutionId": "abc-123"
 * }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const { questionId } = params
    const body = await request.json()
    const { solutionId } = body

    if (!solutionId) {
      return NextResponse.json(
        { error: "solutionId is required" },
        { status: 400 }
      )
    }

    // Deleting it also deletes any replies (if using cascade in self-relation).
    await prisma.solution.delete({ where: { id: solutionId } })

    return NextResponse.json({ message: "Solution deleted" })
  } catch (error) {
    console.error("DELETE solution error:", error)
    return NextResponse.json(
      { error: "Failed to delete solution" },
      { status: 500 }
    )
  }
}

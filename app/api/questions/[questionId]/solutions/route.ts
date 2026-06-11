import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { isAdmin, requireSession } from "@/lib/auth";
import { sanitizeRichText } from "@/lib/sanitize";

const MAX_TOP_LEVEL = 200;

const createSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  parentId: z.string().trim().min(1).max(120).nullish(),
});

/**
 * GET /api/questions/[questionId]/solutions
 * Returns top-level solutions (and nested replies) for a question.
 * Content is sanitized on write; rendering still re-sanitizes (defense in depth).
 */
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const solutions = await prisma.solution.findMany({
      where: { questionId: params.questionId, parentId: null },
      orderBy: { createdAt: "desc" },
      take: MAX_TOP_LEVEL,
      include: {
        author: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          take: 100,
          include: {
            author: { select: { id: true, name: true, image: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              take: 100,
              include: {
                author: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(solutions);
  } catch (error) {
    console.error("GET solutions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions/[questionId]/solutions  (authenticated)
 * Creates a solution or reply. authorId is ALWAYS the session user — never
 * trusted from the body. Content is sanitized before persisting.
 */
export async function POST(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const content = sanitizeRichText(parsed.data.content);
    if (!content.trim()) {
      return NextResponse.json(
        { error: "Content is empty after sanitization" },
        { status: 400 }
      );
    }

    // A reply must point at an existing solution for the SAME question.
    if (parsed.data.parentId) {
      const parent = await prisma.solution.findUnique({
        where: { id: parsed.data.parentId },
        select: { questionId: true },
      });
      if (!parent || parent.questionId !== params.questionId) {
        return NextResponse.json(
          { error: "Parent solution not found for this question" },
          { status: 400 }
        );
      }
    }

    const newSolution = await prisma.solution.create({
      data: {
        questionId: params.questionId,
        content,
        parentId: parsed.data.parentId || null,
        authorId: session.user.id,
      },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(newSolution, { status: 201 });
  } catch (error) {
    console.error("POST solution error:", error);
    return NextResponse.json(
      { error: "Failed to create solution" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/questions/[questionId]/solutions  (authenticated)
 * Likes are toggled per-user so a single account cannot inflate counts by
 * replaying the request.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = await request.json();
    const solutionId = typeof body?.solutionId === "string" ? body.solutionId : null;
    if (!solutionId) {
      return NextResponse.json(
        { error: "solutionId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.solution.findUnique({
      where: { id: solutionId },
      select: { id: true, questionId: true, authorId: true, content: true },
    });
    if (!existing || existing.questionId !== params.questionId) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    // Edit (author or admin only); content re-sanitized.
    if (typeof body?.content === "string") {
      if (existing.authorId !== session.user.id && !isAdmin(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const content = sanitizeRichText(body.content);
      if (!content.trim()) {
        return NextResponse.json({ error: "Empty content" }, { status: 400 });
      }
      const updated = await prisma.solution.update({
        where: { id: solutionId },
        data: { content },
      });
      return NextResponse.json(updated);
    }

    // Like toggle, recorded per-user via likedSolutions on the session user.
    if (body?.like !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { likedSolutionIds: true },
      });
      const liked = new Set(user?.likedSolutionIds ?? []);
      const alreadyLiked = liked.has(solutionId);
      if (alreadyLiked) liked.delete(solutionId);
      else liked.add(solutionId);

      const [, updated] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { likedSolutionIds: Array.from(liked) },
        }),
        prisma.solution.update({
          where: { id: solutionId },
          data: { likes: { increment: alreadyLiked ? -1 : 1 } },
        }),
      ]);
      return NextResponse.json({ ...updated, liked: !alreadyLiked });
    }

    return NextResponse.json({ message: "Nothing to update" });
  } catch (error) {
    console.error("PATCH solution error:", error);
    return NextResponse.json(
      { error: "Failed to update solution" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions/[questionId]/solutions  (author or admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = await request.json();
    const solutionId = typeof body?.solutionId === "string" ? body.solutionId : null;
    if (!solutionId) {
      return NextResponse.json(
        { error: "solutionId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.solution.findUnique({
      where: { id: solutionId },
      select: { id: true, questionId: true, authorId: true },
    });
    if (!existing || existing.questionId !== params.questionId) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id && !isAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.solution.delete({ where: { id: solutionId } });
    return NextResponse.json({ message: "Solution deleted" });
  } catch (error) {
    console.error("DELETE solution error:", error);
    return NextResponse.json(
      { error: "Failed to delete solution" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { assertWritable } from "@/lib/admin-controls";
import { containsProfanity, PROFANITY_ERROR } from "@/lib/profanity";

const MAX_ISSUES = 500;

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10_000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  area: z.enum(["CONTENT", "UI", "BUG", "FEATURE", "OTHER"]),
});

/**
 * GET /api/issues            -> issues for the community board (auth required)
 * GET /api/issues?user=true  -> only the caller's own issues
 *
 * Reporter EMAIL is never returned (only name) — it previously leaked the
 * email of every reporter to any unauthenticated caller.
 */
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const onlyMine = req.nextUrl.searchParams.get("user") === "true";
    const issues = await prisma.issue.findMany({
      where: onlyMine ? { createdById: session.user.id } : undefined,
      take: MAX_ISSUES,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "issue", { limit: 8, windowSec: 600 }, session.user.id);
  if (limited) return limited;
  const ro = await assertWritable();
  if (ro) return ro;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, priority, area } = parsed.data;

    if (containsProfanity(title, description)) {
      return NextResponse.json({ error: PROFANITY_ERROR }, { status: 400 });
    }

    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        area,
        status: "OPEN",
        createdBy: { connect: { id: session.user.id } },
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

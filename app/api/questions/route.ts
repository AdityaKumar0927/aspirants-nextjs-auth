import { NextResponse } from "next/server";
import { QuestionStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  getCurrentSession,
  isAdmin,
  requireAdmin,
  requireSession,
} from "@/lib/auth";
import {
  memberQuestionPatchSchema,
  questionCreateSchema,
  questionUpdateSchema,
  toQuestionCreateData,
} from "@/lib/validations/question";

const MAX_PAGE_SIZE = 200;

/**
 * Utility to parse comma-separated query params:
 * e.g. "JEE,NEET" => ["JEE", "NEET"]
 */
function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length ? parts : undefined;
}

function csvToTags(customTag: string | null): string[] {
  if (!customTag) return [];
  return customTag.split(",").map((tag) => tag.trim());
}

function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Validation failed", issues: error.flatten() },
    { status: 400 }
  );
}

/**
 * GET /api/questions
 *
 * Optional query parameters (comma-separated for multi-value):
 *   exam, subject, topic, subtopic, difficulty, year, type, yearKey,
 *   page (default 1), pageSize (default 10, max 200)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "10", 10) || 10, 1),
      MAX_PAGE_SIZE
    );

    const examArr = parseCommaParam(searchParams.get("exam"));
    const subjectArr = parseCommaParam(searchParams.get("subject"));
    const topicArr = parseCommaParam(searchParams.get("topic"));
    const subtopicArr = parseCommaParam(searchParams.get("subtopic"));
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"));
    const yearStrArr = parseCommaParam(searchParams.get("year"));
    const typeArr = parseCommaParam(searchParams.get("type"));
    const yearKeyArr = parseCommaParam(searchParams.get("yearKey"));
    const statusArr = parseCommaParam(searchParams.get("status"));

    const where: Record<string, unknown> = {};

    // Status visibility: the public only ever sees ACTIVE questions. DRAFT /
    // ARCHIVED (e.g. freshly imported, unreviewed questions) are admin-only —
    // without this, imported drafts would leak into the public question bank.
    const VALID_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"];
    if (statusArr && !(statusArr.length === 1 && statusArr[0] === "ACTIVE")) {
      const isAdminViewer = isAdmin(await getCurrentSession());
      if (isAdminViewer) {
        const requested = statusArr.includes("all")
          ? []
          : statusArr.filter((s) => VALID_STATUSES.includes(s));
        if (requested.length) where.status = { in: requested };
        // "all" => no status filter (every status visible to admins)
      } else {
        where.status = "ACTIVE";
      }
    } else {
      where.status = "ACTIVE";
    }

    if (examArr) where.exam = { in: examArr };
    if (subjectArr) where.subject = { in: subjectArr };
    if (topicArr) where.topic = { in: topicArr };
    if (subtopicArr) where.subtopic = { in: subtopicArr };
    if (difficultyArr) where.difficulty = { in: difficultyArr };
    if (typeArr) where.type = { in: typeArr };
    if (yearKeyArr) where.yearKey = { in: yearKeyArr };

    if (yearStrArr) {
      const years = yearStrArr
        .map((y) => parseInt(y, 10))
        .filter((n) => !isNaN(n));
      if (years.length) where.year = { in: years };
    }

    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        orderBy: { id: "asc" },
        include: {
          Exam: true,
          // Parent/child questions (comprehension sets):
          Question: true,
          other_Question: true,
          // NOTE: Note / Feedback / Issue / UserAnswer / UserPerformance /
          // UserProgress are deliberately NOT included — they hold per-user
          // content and PII (e.g. reporter identities, private notes) and were
          // previously leaked to every, even unauthenticated, caller. Clients
          // fetch their own state via the dedicated scoped endpoints.
        },
      }),
      prisma.question.count({ where }),
    ]);

    const data = questions.map((q) => ({
      ...q,
      customTags: csvToTags(q.customTag),
    }));

    return NextResponse.json({
      data,
      currentPage: page,
      pageSize,
      totalCount,
    });
  } catch (error) {
    console.error("Error in GET /api/questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions  (admin only)
 *
 * Creates a single question in the canonical format
 * (see lib/validations/question.ts).
 */
export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const parsed = questionCreateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const created = await prisma.question.create({
      data: {
        ...toQuestionCreateData(parsed.data),
        status: parsed.data.status ?? QuestionStatus.ACTIVE,
      },
    });

    return NextResponse.json(
      { ...created, customTags: csvToTags(created.customTag) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/questions
 *
 * - Admins may update any canonical field.
 * - Signed-in members may only toggle lightweight study-state fields
 *   (completed, reviewed, customTags, difficulty, difficultyRating).
 */
export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = await request.json();
    const schema = isAdmin(session)
      ? questionUpdateSchema
      : memberQuestionPatchSchema;
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { questionId, customTags, ...rest } = parsed.data as Record<
      string,
      unknown
    > & { questionId: string; customTags?: string[] };

    const data: Record<string, unknown> = { ...rest };
    if (customTags !== undefined) data.customTag = customTags.join(",");

    const updated = await prisma.question.update({
      where: { questionId },
      data,
    });

    return NextResponse.json({
      ...updated,
      customTags: csvToTags(updated.customTag),
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions  (admin only)
 *
 * Body: { "questionId": "Q123" }
 */
export async function DELETE(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { questionId } = await request.json();
    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    await prisma.question.delete({ where: { questionId } });
    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}

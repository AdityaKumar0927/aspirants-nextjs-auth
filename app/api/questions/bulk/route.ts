import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { ImportJobStatus, QuestionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  bulkImportSchema,
  toQuestionCreateData,
  type QuestionCreateInput,
} from "@/lib/validations/question";

/**
 * Deterministic id derived from question content, so re-uploading the same
 * paper produces the same questionIds and createMany({ skipDuplicates }) drops
 * the repeats instead of inserting duplicates.
 */
function contentHashId(q: QuestionCreateInput): string {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const basis = [
    q.type,
    norm(q.text),
    q.options.map(norm).join("|"),
    q.correctOption ?? "",
    [...q.correctOptions].sort().join(","),
    q.answerText ?? "",
    q.answerMin ?? "",
    q.answerMax ?? "",
  ].join("::");
  return `imp_${createHash("sha1").update(basis).digest("hex").slice(0, 24)}`;
}

/**
 * POST /api/questions/bulk  (admin only)
 *
 * Bulk-inserts questions produced by the PDF import wizard (or any other
 * batch source). Questions land as DRAFT unless a status is explicitly set,
 * so imports never go live without review. Records an ImportJob row linking
 * the created questions to the upload for auditability.
 *
 * Body: { fileName, pageCount?, tokensUsed?, questions: QuestionCreateInput[] }
 */
export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const parsed = bulkImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fileName, pageCount, tokensUsed, questions } = parsed.data;

  const job = await prisma.importJob.create({
    data: {
      userId: session.user.id,
      fileName,
      pageCount: pageCount ?? 0,
      tokensUsed: tokensUsed ?? 0,
      status: ImportJobStatus.PROCESSING,
    },
  });

  try {
    // Deduplicate within this batch by content id first (createMany would
    // otherwise reject in-batch duplicates), then let skipDuplicates handle
    // collisions with already-imported questions.
    const byId = new Map<string, (typeof questions)[number] & { _id: string }>();
    for (const q of questions) {
      const _id = q.questionId ?? contentHashId(q);
      if (!byId.has(_id)) byId.set(_id, { ...q, _id });
    }

    const data = Array.from(byId.values()).map(({ _id, ...q }) => ({
      ...toQuestionCreateData(q),
      questionId: _id,
      status: q.status ?? QuestionStatus.DRAFT,
      source: q.source ?? `PDF import: ${fileName}`,
      importJobId: job.id,
    }));

    const result = await prisma.question.createMany({
      data,
      skipDuplicates: true, // duplicate questionId (re-upload) => skipped, not fatal
    });

    const completedJob = await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportJobStatus.COMPLETED,
        questionCount: result.count,
      },
    });

    return NextResponse.json(
      {
        job: completedJob,
        created: result.count,
        requested: questions.length,
        skipped: questions.length - result.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/questions/bulk:", error);
    await prisma.importJob
      .update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
      .catch(() => undefined);
    return NextResponse.json(
      { error: "Failed to import questions" },
      { status: 500 }
    );
  }
}

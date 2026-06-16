import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/**
 * GET /api/user-banks/[id]/export — owner-only download of a bank as
 * import-compatible JSON (the same shape the create flow accepts), so a student
 * can back up a bank or move it elsewhere and re-import it later.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const bank = await prisma.userBank.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!bank || bank.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = {
    title: bank.title,
    description: bank.description,
    questions: bank.questions.map((q) => ({
      text: q.text,
      type: q.type,
      options: q.options,
      correctOption: q.correctOption,
      correctOptions: q.correctOptions,
      answerText: q.answerText,
      answerMin: q.answerMin,
      answerMax: q.answerMax,
      explanation: q.explanation,
      markscheme: q.markscheme,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negMarks: q.negMarks,
    })),
  };

  const slug = bank.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "bank";

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${slug}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertSameOrigin, rateLimit } from "@/lib/rate-limit";
import { bankMetaSchema, validateBankImport } from "@/lib/userbank/schema";

/**
 * "Bring your own material" — a student's PRIVATE question banks.
 *
 * GET  /api/user-banks      — list the caller's banks (metadata only).
 * POST /api/user-banks      — create a bank from validated import JSON.
 *
 * All banks are owner-scoped; nothing here is shared between users.
 */

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const banks = await prisma.userBank.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      defaultMode: true,
      examDurationMin: true,
      questionCount: true,
      lastTakenAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const res = NextResponse.json(banks);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "user-bank-create", { limit: 20, windowSec: 3600 }, session.user.id);
  if (limited) return limited;

  // Guard the raw size before parsing (banks can carry up to 500 questions).
  const rawBody = await req.text();
  if (rawBody.length > 4_000_000) {
    return NextResponse.json({ error: "That import is too large." }, { status: 413 });
  }
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const meta = bankMetaSchema.safeParse(body);
  if (!meta.success) {
    return NextResponse.json(
      { error: meta.error.issues[0]?.message ?? "Invalid bank details." },
      { status: 400 }
    );
  }

  // Re-validate the questions server-side — never trust the client's normalization.
  const { questions } = validateBankImport({ questions: body.questions });
  if (questions.length === 0) {
    return NextResponse.json({ error: "No usable questions to import." }, { status: 400 });
  }

  const bank = await prisma.userBank.create({
    data: {
      userId: session.user.id,
      title: meta.data.title,
      description: meta.data.description ?? null,
      defaultMode: meta.data.defaultMode,
      examDurationMin: meta.data.examDurationMin ?? null,
      questionCount: questions.length,
      questions: {
        create: questions.map((q, i) => ({
          order: i,
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
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: bank.id }, { status: 201 });
}

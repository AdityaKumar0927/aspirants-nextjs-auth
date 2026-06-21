import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/rate-limit";
import { assertWritable, requireFeature, assertNotBanned } from "@/lib/admin-controls";
import { normalizeEditQuestions, MAX_BANK_QUESTIONS } from "@/lib/userbank/schema";

/**
 * One private question bank, owner-only.
 *
 * GET    — full bank + questions (for practice / exam).
 * PATCH  — routed by payload shape:
 *            • { result }                       → save the last exam attempt
 *            • { questionId, completed?, flagged? } → toggle one question's state
 *            • { questions: [...] , ...meta }    → full edit: diff-save the set
 *            • { title?/description?/mode?/... } → meta only (rename etc.)
 * DELETE — permanently remove the bank (questions cascade).
 *
 * A non-owner (or unknown id) always gets 404 — we never reveal a bank exists.
 */

const MAX_RESULT_BYTES = 200_000;
const MAX_BODY_BYTES = 5_000_000;

/** Verify the caller owns this bank; returns the id or a 404 response. */
async function requireOwnedBank(id: string, userId: string) {
  const bank = await prisma.userBank.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!bank || bank.userId !== userId) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { bank };
}

/** Extract validated bank-meta fields from a PATCH body (shared by branches). */
function readMeta(body: any) {
  const data: { title?: string; description?: string | null; defaultMode?: string; examDurationMin?: number | null } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 200);
  if (body.description !== undefined)
    data.description = body.description ? String(body.description).slice(0, 2_000) : null;
  if (body.defaultMode === "BANK" || body.defaultMode === "EXAM") data.defaultMode = body.defaultMode;
  if (body.examDurationMin !== undefined) {
    const n = Number(body.examDurationMin);
    data.examDurationMin = Number.isFinite(n) ? Math.min(600, Math.max(1, Math.round(n))) : null;
  }
  return data;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const off = await requireFeature("userBanks");
  if (off) return off;

  const { id } = await params;
  const bank = await prisma.userBank.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!bank || bank.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const res = NextResponse.json(bank);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const off = await requireFeature("userBanks");
  if (off) return off;
  const ro = await assertWritable();
  if (ro) return ro;
  const banned = await assertNotBanned(req);
  if (banned) return banned;

  const { id } = await params;
  const owned = await requireOwnedBank(id, session.user.id);
  if (owned.response) return owned.response;

  let body: any;
  try {
    // Measure the actual buffered body — Content-Length is client-controlled and
    // absent on chunked requests, so it can't be the only guard.
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "That edit is too large." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 1) Save an exam result.
  if (body.result !== undefined) {
    if (JSON.stringify(body.result).length > MAX_RESULT_BYTES) {
      return NextResponse.json({ error: "Result is too large to save." }, { status: 413 });
    }
    await prisma.userBank.update({
      where: { id },
      data: { lastResult: body.result, lastTakenAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // 2) Per-question practice state (scoped to this bank).
  if (typeof body.questionId === "string") {
    const data: { completed?: boolean; flagged?: boolean } = {};
    if (typeof body.completed === "boolean") data.completed = body.completed;
    if (typeof body.flagged === "boolean") data.flagged = body.flagged;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    await prisma.userBankQuestion.updateMany({
      where: { id: body.questionId, bankId: id },
      data,
    });
    return NextResponse.json({ ok: true });
  }

  // 3) Full edit: diff-save the question set (+ any meta) atomically.
  if (Array.isArray(body.questions)) {
    if (body.questions.length > MAX_BANK_QUESTIONS) {
      return NextResponse.json(
        { error: `A bank can hold at most ${MAX_BANK_QUESTIONS} questions.` },
        { status: 400 }
      );
    }

    // Normalize, then drop duplicate ids (keep first) so each row maps to one op
    // and questionCount matches the rows actually written.
    const seenIds = new Set<string>();
    const incoming = normalizeEditQuestions(body.questions).filter((q) => {
      if (!q.id) return true;
      if (seenIds.has(q.id)) return false;
      seenIds.add(q.id);
      return true;
    });
    if (incoming.length === 0) {
      return NextResponse.json({ error: "Keep at least one question." }, { status: 400 });
    }

    const badRange = incoming.findIndex(
      (q) => q.type === "Numerical" && q.answerMin != null && q.answerMax != null && q.answerMin > q.answerMax
    );
    if (badRange >= 0) {
      return NextResponse.json(
        { error: `Question ${badRange + 1}: minimum is greater than maximum.` },
        { status: 400 }
      );
    }

    const existing = await prisma.userBankQuestion.findMany({ where: { bankId: id }, select: { id: true } });
    const existingIds = new Set(existing.map((e) => e.id));
    const keepIds = new Set(incoming.filter((q) => q.id && existingIds.has(q.id)).map((q) => q.id as string));
    const toDelete = [...existingIds].filter((eid) => !keepIds.has(eid));

    const ops: any[] = [];
    if (toDelete.length) {
      ops.push(prisma.userBankQuestion.deleteMany({ where: { id: { in: toDelete }, bankId: id } }));
    }
    incoming.forEach((q, order) => {
      const content = {
        order,
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
        hints: q.hints,
        markschemeData: q.markschemeData ? (q.markschemeData as Prisma.InputJsonValue) : Prisma.DbNull,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        negMarks: q.negMarks,
      };
      if (q.id && existingIds.has(q.id)) {
        // Update content + order only — completed/flagged are preserved.
        ops.push(prisma.userBankQuestion.update({ where: { id: q.id }, data: content }));
      } else {
        ops.push(prisma.userBankQuestion.create({ data: { bankId: id, ...content } }));
      }
    });
    ops.push(prisma.userBank.update({ where: { id }, data: { ...readMeta(body), questionCount: incoming.length } }));

    await prisma.$transaction(ops);
    return NextResponse.json({ ok: true });
  }

  // 4) Bank meta only (rename / mode / duration).
  const data = readMeta(body);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  await prisma.userBank.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const off = await requireFeature("userBanks");
  if (off) return off;
  const ro = await assertWritable();
  if (ro) return ro;
  const banned = await assertNotBanned(req);
  if (banned) return banned;

  const { id } = await params;
  const owned = await requireOwnedBank(id, session.user.id);
  if (owned.response) return owned.response;

  // UserBankQuestion has onDelete: Cascade, so the questions go with it.
  await prisma.userBank.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

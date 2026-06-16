import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/rate-limit";

/**
 * One private question bank, owner-only.
 *
 * GET    — full bank + questions (for practice / exam).
 * PATCH  — routed by payload shape: meta (rename/mode/duration), per-question
 *          state ({questionId, completed?, flagged?}), or a saved exam result.
 * DELETE — permanently remove the bank (questions cascade).
 *
 * A non-owner (or unknown id) always gets 404 — we never reveal a bank exists.
 */

const MAX_RESULT_BYTES = 200_000;

/** Verify the caller owns this bank; returns the id or a 404 response. */
async function requireOwnedBank(id: string, userId: string) {
  const bank = await prisma.userBank.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!bank || bank.userId !== userId) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { bank };
}

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

  const res = NextResponse.json(bank);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const { id } = await params;
  const owned = await requireOwnedBank(id, session.user.id);
  if (owned.response) return owned.response;

  let body: any;
  try {
    body = await req.json();
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

  // 3) Bank meta.
  const data: {
    title?: string;
    description?: string | null;
    defaultMode?: string;
    examDurationMin?: number | null;
  } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 200);
  if (body.description !== undefined)
    data.description = body.description ? String(body.description).slice(0, 2_000) : null;
  if (body.defaultMode === "BANK" || body.defaultMode === "EXAM") data.defaultMode = body.defaultMode;
  if (body.examDurationMin !== undefined) {
    const n = Number(body.examDurationMin);
    data.examDurationMin = Number.isFinite(n) ? Math.min(600, Math.max(1, Math.round(n))) : null;
  }
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

  const { id } = await params;
  const owned = await requireOwnedBank(id, session.user.id);
  if (owned.response) return owned.response;

  // UserBankQuestion has onDelete: Cascade, so the questions go with it.
  await prisma.userBank.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

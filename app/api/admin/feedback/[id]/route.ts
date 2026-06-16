import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { FeedbackStatus } from "@prisma/client";

/**
 * GET  /api/admin/feedback/[id]  — full thread for one feedback item.
 * POST /api/admin/feedback/[id]  — admin posts a clarification message; the
 *                                  submitter is notified (bell) and can reply.
 * PATCH /api/admin/feedback/[id] — change status (OPEN/AWAITING_USER/RESOLVED).
 *
 * Anonymous feedback never exposes the submitter's identity in any response.
 */
async function loadFeedback(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      emoji: true,
      feedbackType: true,
      status: true,
      anonymous: true,
      questionId: true,
      createdAt: true,
      userId: true,
      User: { select: { name: true, email: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, fromAdmin: true, content: true, createdAt: true },
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const f = await loadFeedback(id);
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const res = NextResponse.json({
    id: f.id,
    content: f.content,
    emoji: f.emoji,
    feedbackType: f.feedbackType,
    status: f.status,
    anonymous: f.anonymous,
    questionId: f.questionId,
    createdAt: f.createdAt,
    user: f.anonymous
      ? null
      : { name: f.User?.name ?? null, email: f.User?.email ?? null, image: f.User?.image ?? null },
    messages: f.messages,
  });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const postSchema = z.object({ content: z.string().trim().min(1).max(5000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  let parsed;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.feedbackMessage.create({
    data: {
      feedbackId: id,
      fromAdmin: true,
      authorId: session.user.id,
      content: parsed.content,
    },
  });
  await prisma.feedback.update({ where: { id }, data: { status: "AWAITING_USER" } });

  // Notify the submitter. relatedFeedbackId lets the bell show an inline reply
  // box so they can answer the clarification right there.
  await prisma.notification.create({
    data: {
      userId: feedback.userId,
      type: "FEEDBACK_RESPONSE",
      title: "The team replied to your feedback",
      message: parsed.content,
      relatedFeedbackId: id,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "AWAITING_USER", "RESOLVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const resolved = parsed.status === "RESOLVED";
  await prisma.feedback.update({
    where: { id },
    data: {
      status: parsed.status as FeedbackStatus,
      resolved,
      resolvedBy: resolved ? session.user.id : null,
    },
  });

  return NextResponse.json({ ok: true });
}

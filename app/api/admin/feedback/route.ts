import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { FeedbackStatus } from "@prisma/client";

/**
 * Admin feedback queue. Optional ?status= filter. Anonymous submissions are
 * returned WITHOUT any identifying fields — the admin sees the content and can
 * still converse via the thread, but never the submitter's name or email.
 */
export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const valid: FeedbackStatus[] = ["OPEN", "AWAITING_USER", "RESOLVED"];
  const where =
    statusParam && valid.includes(statusParam as FeedbackStatus)
      ? { status: statusParam as FeedbackStatus }
      : {};

  const rows = await prisma.feedback.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }], // OPEN first, newest first
    take: 500,
    select: {
      id: true,
      content: true,
      emoji: true,
      feedbackType: true,
      status: true,
      anonymous: true,
      questionId: true,
      createdAt: true,
      User: { select: { name: true, email: true, image: true } },
      _count: { select: { messages: true } },
    },
  });

  const data = rows.map((f) => ({
    id: f.id,
    content: f.content,
    emoji: f.emoji,
    feedbackType: f.feedbackType,
    status: f.status,
    anonymous: f.anonymous,
    questionId: f.questionId,
    createdAt: f.createdAt,
    messageCount: f._count.messages,
    // Identity is stripped server-side for anonymous feedback.
    user: f.anonymous
      ? null
      : { name: f.User?.name ?? null, email: f.User?.email ?? null, image: f.User?.image ?? null },
  }));

  const res = NextResponse.json(data);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

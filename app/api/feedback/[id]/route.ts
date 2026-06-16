import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const replySchema = z.object({ content: z.string().trim().min(1).max(5000) });

/**
 * POST /api/feedback/[id] — the submitter replies to an admin's clarification
 * request on their OWN feedback (from the notification bell). Appends to the
 * thread, flips the feedback back to OPEN (needs admin attention), and pings
 * the admin(s) who took part so they see the reply in their bell.
 *
 * Anonymous feedback still works here: ownership is checked by userId, which the
 * admin never sees — so the reply routes correctly without revealing identity.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  let parsed;
  try {
    parsed = replySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "A reply is required." }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  // Only the submitter may reply here; don't reveal others' feedback.
  if (!feedback || feedback.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.feedbackMessage.create({
    data: {
      feedbackId: id,
      fromAdmin: false,
      authorId: session.user.id,
      content: parsed.content,
    },
  });
  await prisma.feedback.update({ where: { id }, data: { status: "OPEN" } });

  // Ping the admin(s) who already engaged. No relatedFeedbackId on these so the
  // bell shows them as a plain alert (no reply box) — admins reply from the
  // admin console, not the bell.
  const adminMsgs = await prisma.feedbackMessage.findMany({
    where: { feedbackId: id, fromAdmin: true },
    select: { authorId: true },
  });
  const adminIds = [...new Set(adminMsgs.map((m) => m.authorId))];
  if (adminIds.length) {
    await prisma.notification.createMany({
      data: adminIds.map((adminId) => ({
        userId: adminId,
        type: "FEEDBACK_RESPONSE" as const,
        title: "New reply on feedback",
        message: parsed.content.slice(0, 280),
      })),
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

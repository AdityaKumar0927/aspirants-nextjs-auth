import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { assertWritable, requireFeature, assertNotBanned } from "@/lib/admin-controls";

// Toggle the caller's upvote on a feature request. Returns the new count + state.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const csrf = assertSameOrigin(req); if (csrf) return csrf;
  const limited = await rateLimit(req, "feature-request-vote", { limit: 30, windowSec: 60 }, session.user.id); if (limited) return limited;
  const off = await requireFeature("featureRequests"); if (off) return off;
  const ro = await assertWritable(); if (ro) return ro;
  const banned = await assertNotBanned(req); if (banned) return banned;
  const { id } = await params;

  const exists = await prisma.featureRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const existing = await prisma.featureRequestVote.findUnique({
    where: { featureRequestId_userId: { featureRequestId: id, userId: session.user.id } },
    select: { id: true },
  });

  let hasVoted: boolean;
  if (existing) {
    await prisma.featureRequestVote.delete({ where: { id: existing.id } });
    hasVoted = false;
  } else {
    await prisma.featureRequestVote.create({
      data: { featureRequestId: id, userId: session.user.id },
    });
    hasVoted = true;
  }

  const votes = await prisma.featureRequestVote.count({ where: { featureRequestId: id } });
  return NextResponse.json({ votes, hasVoted });
}

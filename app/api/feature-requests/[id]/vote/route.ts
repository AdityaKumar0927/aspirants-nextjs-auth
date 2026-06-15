import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// Toggle the caller's upvote on a feature request. Returns the new count + state.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
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

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/**
 * DELETE /api/feature-requests/[id] — the author permanently deletes their OWN
 * feature request (and its votes + comments). Only the creator may delete here;
 * admins use the admin route.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  const fr = await prisma.featureRequest.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
  // Don't reveal others' requests; only the owner can delete here.
  if (!fr || fr.createdById !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove children first so it works regardless of cascade config.
  await prisma.$transaction([
    prisma.featureRequestVote.deleteMany({ where: { featureRequestId: id } }),
    prisma.featureRequestComment.deleteMany({ where: { featureRequestId: id } }),
    prisma.featureRequest.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}

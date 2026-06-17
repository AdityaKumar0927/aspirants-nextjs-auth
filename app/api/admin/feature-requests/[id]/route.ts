import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { FeatureRequestStatus } from "@prisma/client";

/**
 * PATCH /api/admin/feature-requests/[id] — change status.
 * DELETE /api/admin/feature-requests/[id] — remove any request (+ its votes/comments).
 */
const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
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

  await prisma.featureRequest.update({
    where: { id },
    data: { status: parsed.status as FeatureRequestStatus },
  });

  await logAudit({
    userId: session.user.id,
    action: "FEATURE_REQUEST_STATUS_CHANGED",
    metadata: { featureRequestId: id, status: parsed.status },
    req,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.$transaction([
    prisma.featureRequestVote.deleteMany({ where: { featureRequestId: id } }),
    prisma.featureRequestComment.deleteMany({ where: { featureRequestId: id } }),
    prisma.featureRequest.delete({ where: { id } }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "FEATURE_REQUEST_DELETED",
    metadata: { featureRequestId: id },
    req,
  });

  return NextResponse.json({ ok: true });
}

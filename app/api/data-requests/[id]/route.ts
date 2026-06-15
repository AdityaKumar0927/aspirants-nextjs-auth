import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Admin handling of a data-principal request: update status and record the
 * resolution. Staff fulfil the underlying request (export, correction, erasure,
 * grievance reply) out of band; this tracks status + SLA.
 */
const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"]),
  response: z.string().max(5000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: guard } = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const resolved = parsed.status === "RESOLVED" || parsed.status === "REJECTED";

  const updated = await prisma.dataRequest.update({
    where: { id },
    data: {
      status: parsed.status,
      response: parsed.response ?? undefined,
      resolvedAt: resolved ? new Date() : null,
      resolvedBy: resolved ? session.user.id : null,
    },
  });

  await logAudit({
    userId: updated.userId,
    action: "DATA_REQUEST_UPDATED",
    metadata: { requestId: id, status: parsed.status, by: session.user.id },
    req,
  });

  return NextResponse.json(updated);
}

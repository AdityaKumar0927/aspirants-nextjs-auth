// app/api/user/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Self-service erasure (DPDP right to erasure). Hard-deletes the user; cascading
 * deletes remove all related personal data. An ERASURE_COMPLETED audit row is
 * written FIRST — AuditLog has no FK to User, so the deletion record survives
 * the cascade and we can prove the erasure happened.
 */
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const userId = session.user.id;

    // Record the erasure before the row (and its email) are gone.
    await logAudit({
      userId,
      action: "ERASURE_COMPLETED",
      metadata: { initiatedBy: "self-service" },
      req,
    });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json(
      { message: "Your account and personal data have been deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// app/api/user/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";

/**
 * Self-service erasure (DPDP right to erasure). Hard-deletes the user; cascading
 * deletes remove all related personal data. An ERASURE_COMPLETED audit row is
 * written FIRST — AuditLog has no FK to User, so the deletion record survives
 * the cascade and we can prove the erasure happened.
 */
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "account-delete", { limit: 3, windowSec: 3600 }, session.user.id);
  if (limited) return limited;

  try {
    const userId = session.user.id;

    // Record the erasure before the row (and its email) are gone.
    await logAudit({
      userId,
      action: "ERASURE_COMPLETED",
      metadata: { initiatedBy: "self-service" },
      req,
    });

    // Cascade removes the user's own data, but FeedbackMessage rows the user
    // authored on OTHER users' threads (authorId = userId, no cascade from User)
    // would be orphaned — erase those too for right-to-erasure completeness.
    await prisma.$transaction([
      prisma.feedbackMessage.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json(
      { message: "Your account and personal data have been deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

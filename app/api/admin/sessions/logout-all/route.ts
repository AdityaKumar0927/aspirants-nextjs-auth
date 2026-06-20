import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/**
 * "Nuke all sessions" — the breach break-glass. Sets AppConfig.sessionsValidFrom
 * to now; the jwt() callback rejects any session minted before that instant
 * (within the ~60s control-resync window), so every signed-in user — INCLUDING
 * the admin who pressed it — is forced to re-authenticate. Re-login mints a
 * fresh token (loginAt > epoch), which survives.
 *
 * Super-admin only, CSRF-guarded, rate-limited, and requires a step-up
 * confirmation (`confirm: true`).
 */
export async function POST(req: NextRequest) {
  const { session, response } = await requireSuperAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "logout-all", { limit: 5, windowSec: 300 }, session.user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  if ((body as { confirm?: unknown }).confirm !== true) {
    return NextResponse.json(
      { error: "confirmation_required", message: "This signs out everyone (including you). Confirm to proceed." },
      { status: 428 }
    );
  }

  const now = new Date();
  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: { sessionsValidFrom: now, updatedBy: session.user.id },
    create: { id: 1, sessionsValidFrom: now, updatedBy: session.user.id },
  });

  await logAudit({
    userId: session.user.id,
    action: "SESSIONS_REVOKED_ALL",
    metadata: { at: now.toISOString() },
    req,
  });

  return NextResponse.json({ ok: true, sessionsValidFrom: now.toISOString() });
}

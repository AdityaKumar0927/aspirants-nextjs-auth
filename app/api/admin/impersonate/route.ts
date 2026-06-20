import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  requireSuperAdmin,
  requireSession,
  getCurrentSession,
  STAFF_ROLES,
} from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getAppConfig } from "@/lib/app-config";
import {
  signImpersonationToken,
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_MS,
  impersonationCookieOptions,
} from "@/lib/impersonation";

/**
 * Support impersonation — STRONGLY guarded (see lib/impersonation.ts).
 *   GET    -> current impersonation status (for the on-screen banner).
 *   POST   -> start impersonating { targetUserId } (super-admin + step-up).
 *   DELETE -> stop impersonating (always allowed for the impersonating admin).
 *
 * Guardrails: super-admin only to START (which, because requireSuperAdmin runs
 * on the EFFECTIVE session, also prevents nesting — you can't start a new
 * impersonation while already impersonating); the master impersonationEnabled
 * switch; cannot target another administrator or yourself; time-boxed signed
 * cookie; every start/stop audited. Privilege can never be elevated — the
 * overlay carries `impersonatedBy`, so requireRole() refuses all privileged
 * actions until the admin stops.
 */

const startSchema = z.object({
  // Accept a user id OR an email — resolved below.
  target: z.string().trim().min(1).max(255),
  confirm: z.literal(true),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ impersonating: false }, { status: 200 });
  }
  if (session.user.impersonatedBy) {
    return NextResponse.json({
      impersonating: true,
      realUserId: session.user.impersonatedBy,
      target: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      },
    });
  }
  return NextResponse.json({ impersonating: false });
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSuperAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "impersonate", { limit: 10, windowSec: 300 }, session.user.id);
  if (limited) return limited;

  const config = await getAppConfig();
  if (!config.impersonationEnabled) {
    return NextResponse.json({ error: "Impersonation is disabled." }, { status: 403 });
  }

  let body;
  try {
    body = startSchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: msg ?? "confirmation_required" }, { status: 400 });
  }

  const lookup = body.target.includes("@")
    ? { email: body.target.toLowerCase() }
    : { id: body.target };
  const target = await prisma.user.findUnique({
    where: lookup,
    select: { id: true, email: true, UserRole: { select: { name: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You cannot impersonate yourself." }, { status: 400 });
  }
  // No impersonating staff — support impersonation is for helping regular users,
  // and a staff target could otherwise expose moderator/admin-gated actions
  // through helpers that authorize on role alone.
  if (target.UserRole?.name && (STAFF_ROLES as readonly string[]).includes(target.UserRole.name)) {
    return NextResponse.json({ error: "Staff accounts cannot be impersonated." }, { status: 403 });
  }

  const token = signImpersonationToken({
    realUserId: session.user.id,
    targetUserId: target.id,
    exp: Date.now() + IMPERSONATION_MAX_MS,
  });

  await logAudit({
    userId: session.user.id,
    action: "IMPERSONATION_STARTED",
    metadata: { targetUserId: target.id, targetEmail: target.email },
    req,
  });

  const res = NextResponse.json({ ok: true, targetUserId: target.id });
  res.cookies.set(IMPERSONATION_COOKIE, token, {
    ...impersonationCookieOptions,
    maxAge: Math.floor(IMPERSONATION_MAX_MS / 1000),
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  // Authenticate as ANY signed-in user (the effective session may be the target);
  // never use requireRole here or the impersonating admin couldn't stop.
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const realAdminId = session.user.impersonatedBy;
  const res = NextResponse.json({ ok: true });
  // Clear the cookie regardless — it is bound to the caller's session, so this
  // can only ever end the caller's own impersonation.
  res.cookies.set(IMPERSONATION_COOKIE, "", { ...impersonationCookieOptions, maxAge: 0 });

  if (realAdminId) {
    await logAudit({
      userId: realAdminId,
      action: "IMPERSONATION_STOPPED",
      metadata: { targetUserId: session.user.id },
      req,
    });
  }
  return res;
}

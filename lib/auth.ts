import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { readImpersonationCookie } from "@/lib/impersonation";
import { getAppConfig } from "@/lib/app-config";

export const ADMIN_ROLE = "administrator";
/** Roles allowed to triage/moderate community content (issues, etc.). */
export const STAFF_ROLES = ["administrator", "moderator"] as const;

/**
 * The underlying authenticated session — NO impersonation overlay. Endpoints
 * that must always see the real actor (stop-impersonation, the impersonation
 * banner) use this; everything else uses getCurrentSession().
 */
export async function getRealSession(): Promise<Session | null> {
  return auth();
}

/**
 * The EFFECTIVE session for the request. Normally this is just the authenticated
 * session. When a valid impersonation cookie is present AND it was minted by the
 * actually-authenticated admin AND impersonation is enabled, the returned
 * session is overlaid onto the TARGET user — same shape, but carrying
 * `user.impersonatedBy` so privileged guards refuse to act. The overlay can
 * never elevate privilege: the target's own (non-admin) role is used, and
 * requireRole() additionally hard-blocks while impersonatedBy is set.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return session;

  // Fast path: no cookie → no overlay, no DB work.
  const imp = await readImpersonationCookie();
  if (!imp || imp.realUserId !== session.user.id) return session;

  // The cookie is bound to THIS session's user — re-verify they're still an
  // admin and that impersonation hasn't been globally disabled.
  const realRole = await currentRole(session.user.id);
  if (realRole !== ADMIN_ROLE) return session;
  const config = await getAppConfig();
  if (!config.impersonationEnabled) return session;

  const target = await prisma.user.findUnique({
    where: { id: imp.targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      onboardingComplete: true,
      isMinor: true,
      UserRole: { select: { name: true } },
    },
  });
  if (!target) return session;

  // Clamp the overlay role: an impersonation overlay must NEVER carry a
  // privileged role. The start route already refuses staff/admin targets, but
  // this is the authoritative belt-and-suspenders so that no downstream
  // isAdmin()/isStaff() check (which look at role alone) can ever pass while
  // impersonating, even if a target's role changed after the cookie was minted.
  const targetRole = target.UserRole?.name ?? "member";
  const overlayRole = (STAFF_ROLES as readonly string[]).includes(targetRole) ? "member" : targetRole;

  return {
    ...session,
    user: {
      ...session.user,
      id: target.id,
      name: target.name,
      email: target.email,
      image: target.image,
      role: overlayRole,
      onboardingComplete: target.onboardingComplete,
      isMinor: target.isMinor ?? false,
      // Always present on an overlay → privileged guards refuse to act.
      impersonatedBy: imp.realUserId,
    },
  } as Session;
}

type GuardResult =
  | { session: Session; response?: undefined }
  | { session?: undefined; response: NextResponse };

/**
 * Route-handler guard: returns the session, or a ready-to-return 401 response.
 *
 * Usage:
 *   const { session, response } = await requireSession();
 *   if (response) return response;
 */
export async function requireSession(): Promise<GuardResult> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}

/**
 * Reads the user's CURRENT role straight from the database, bypassing the
 * possibly-stale JWT. Privileged guards use this so a suspended / demoted /
 * role-revoked user loses access to sensitive actions IMMEDIATELY, instead of
 * after the JWT role re-sync window (options.ts ROLE_TTL_MS). Returns null when
 * the user or role is missing OR on any DB error, so a privileged guard fails
 * CLOSED. Cost is one indexed lookup, paid only on the low-frequency privileged
 * routes — the common authenticated path stays JWT-only.
 */
export async function currentRole(userId: string): Promise<string | null> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { UserRole: { select: { name: true } } },
    });
    return u?.UserRole?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * Route-handler guard: requires an authenticated user with one of the given
 * roles. The role is verified against the DATABASE (not the JWT) so revoked
 * privilege is enforced immediately.
 */
export async function requireRole(...roles: string[]): Promise<GuardResult> {
  const result = await requireSession();
  if (result.response) return result;

  // No privileged action may be performed while impersonating, even if the
  // impersonated target happens to be staff. The real admin must Stop first.
  if (result.session.user.impersonatedBy) {
    return {
      response: NextResponse.json(
        { error: "Privileged actions are blocked while impersonating. Stop impersonation first." },
        { status: 403 }
      ),
    };
  }

  const role = await currentRole(result.session.user.id);
  if (!role || !roles.includes(role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  // Keep the session's role consistent with the fresh value for any downstream
  // isAdmin(session) / isStaff(session) checks inside the handler.
  result.session.user.role = role;
  return result;
}

export function requireAdmin(): Promise<GuardResult> {
  return requireRole(ADMIN_ROLE);
}

/**
 * Highest-privilege guard for the most destructive admin actions (force-logout,
 * impersonation, kill switches). Today this is the administrator role; it is a
 * distinct entry point so a finer super-admin / support / read-only split can be
 * introduced later without touching every call site. Like requireAdmin it runs
 * through requireRole, so it is also blocked while impersonating.
 */
export function requireSuperAdmin(): Promise<GuardResult> {
  return requireRole(ADMIN_ROLE);
}

export function isAdmin(session: Session | null): boolean {
  // An impersonation overlay is never admin, regardless of the overlay role.
  return !session?.user?.impersonatedBy && session?.user?.role === ADMIN_ROLE;
}

export function isStaff(session: Session | null): boolean {
  if (session?.user?.impersonatedBy) return false;
  const role = session?.user?.role;
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

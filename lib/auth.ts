import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import authOptions from "@/app/api/auth/[...nextauth]/options";

export const ADMIN_ROLE = "administrator";
/** Roles allowed to triage/moderate community content (issues, etc.). */
export const STAFF_ROLES = ["administrator", "moderator"] as const;

export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
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

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === ADMIN_ROLE;
}

export function isStaff(session: Session | null): boolean {
  const role = session?.user?.role;
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

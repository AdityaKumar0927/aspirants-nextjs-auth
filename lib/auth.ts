import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
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
 * Route-handler guard: requires an authenticated user with one of the given roles.
 */
export async function requireRole(...roles: string[]): Promise<GuardResult> {
  const result = await requireSession();
  if (result.response) return result;

  const role = result.session.user.role;
  if (!role || !roles.includes(role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
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

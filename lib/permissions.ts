import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSession } from "@/lib/auth";

/**
 * Capability-based access control.
 *
 * Roles map to a fixed set of capabilities. Guards check a CAPABILITY, not a
 * role name, so the privilege of each role lives in one place and routes/UI
 * read the same source of truth. This is the layer that keeps moderators from
 * doing admin-only things (deleting questions, changing roles, broadcasting,
 * purging audit logs).
 */
export type Capability =
  // Admin-only
  | "question:write"
  | "question:delete"
  | "role:manage"
  | "user:suspend"
  | "notification:broadcast"
  | "audit:purge"
  | "application:review"
  | "settings:write"
  // Staff (admin + moderator)
  | "issue:triage"
  | "feedback:resolve"
  | "stats:view"
  | "moderator:dashboard";

const MODERATOR_CAPABILITIES: Capability[] = [
  "issue:triage",
  "feedback:resolve",
  "stats:view",
  "moderator:dashboard",
];

const ADMIN_CAPABILITIES: Capability[] = [
  "question:write",
  "question:delete",
  "role:manage",
  "user:suspend",
  "notification:broadcast",
  "audit:purge",
  "application:review",
  "settings:write",
  // admins inherit everything moderators can do
  ...MODERATOR_CAPABILITIES,
];

export const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  administrator: ADMIN_CAPABILITIES,
  moderator: MODERATOR_CAPABILITIES,
};

export function capabilitiesFor(role: string | null | undefined): Capability[] {
  if (!role) return [];
  return ROLE_CAPABILITIES[role] ?? [];
}

export function hasCapability(
  role: string | null | undefined,
  capability: Capability
): boolean {
  return capabilitiesFor(role).includes(capability);
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "administrator" || role === "moderator";
}

type GuardResult =
  | { session: Session; response?: undefined }
  | { session?: undefined; response: NextResponse };

/**
 * Route-handler guard: requires an authenticated user whose role grants the
 * given capability. Returns the session, or a ready-to-return 403.
 */
export async function requireCapability(
  capability: Capability
): Promise<GuardResult> {
  const result = await requireSession();
  if (result.response) return result;
  if (!hasCapability(result.session.user.role, capability)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}

/** Requires any staff role (administrator or moderator). */
export async function requireStaff(): Promise<GuardResult> {
  const result = await requireSession();
  if (result.response) return result;
  if (!isStaffRole(result.session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}

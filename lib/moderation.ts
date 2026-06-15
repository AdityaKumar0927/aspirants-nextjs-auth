import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * Moderator abuse controls.
 *
 * Sensitive moderator actions are counted against an hourly budget in the
 * ModeratorLimit table. Blowing the budget trips a circuit breaker that
 * AUTO-REVOKES the moderator (demotes them to a plain member), so a runaway or
 * malicious moderator can't keep causing harm. Admins can also revoke or fully
 * suspend manually. Every transition is written to the audit log.
 *
 * Suspension/revocation reuse the existing role system (no schema change):
 *   - revoke  -> roleId = "member"     (loses staff powers, keeps the account)
 *   - suspend -> roleId = "suspended"  (blocked from the app by middleware)
 */
export const MODERATOR_HOURLY_ACTION_LIMIT = 80;

async function ensureRole(name: string) {
  return prisma.userRole.upsert({
    where: { name },
    update: {},
    create: { name, permissions: {} },
  });
}

/** Demote a user to plain member — revokes all staff powers. */
export async function revokeStaffRole(params: {
  userId: string;
  reason: string;
  actorId?: string | null;
  req?: Request;
}): Promise<void> {
  const member = await ensureRole("member");
  await prisma.user.update({
    where: { id: params.userId },
    data: { roleId: member.id },
  });
  await logAudit({
    userId: params.userId,
    action: "STAFF_ROLE_REVOKED",
    metadata: { reason: params.reason, by: params.actorId ?? "system" },
    req: params.req,
  });
}

/** Fully suspend a user — blocked from the app by middleware until restored. */
export async function suspendUser(params: {
  userId: string;
  reason: string;
  actorId?: string | null;
  req?: Request;
}): Promise<void> {
  const suspended = await ensureRole("suspended");
  await prisma.user.update({
    where: { id: params.userId },
    data: { roleId: suspended.id },
  });
  await logAudit({
    userId: params.userId,
    action: "USER_SUSPENDED",
    metadata: { reason: params.reason, by: params.actorId ?? "system" },
    req: params.req,
  });
}

/**
 * Counts a sensitive moderator action against the hourly budget and trips the
 * auto-revoke breaker if exceeded. Call this from moderator-capable mutations
 * BEFORE performing them; if `allowed` is false the action must be refused.
 */
export async function guardModeratorAction(params: {
  userId: string;
  action: string;
  req?: Request;
}): Promise<{ allowed: boolean; revoked: boolean; remaining: number }> {
  const now = new Date();
  const existing = await prisma.moderatorLimit.findUnique({
    where: { userId: params.userId },
  });

  const HOUR_MS = 60 * 60 * 1000;
  const withinWindow =
    !!existing?.lastChangeHour &&
    now.getTime() - existing.lastChangeHour.getTime() < HOUR_MS;

  const count = (withinWindow ? existing!.changesThisHour : 0) + 1;
  const windowStart = withinWindow ? existing!.lastChangeHour! : now;

  await prisma.moderatorLimit.upsert({
    where: { userId: params.userId },
    update: { changesThisHour: count, lastChangeHour: windowStart },
    create: { userId: params.userId, changesThisHour: 1, lastChangeHour: now },
  });

  if (count > MODERATOR_HOURLY_ACTION_LIMIT) {
    await revokeStaffRole({
      userId: params.userId,
      reason: `Auto-revoked: exceeded ${MODERATOR_HOURLY_ACTION_LIMIT} actions/hour`,
      req: params.req,
    });
    return { allowed: false, revoked: true, remaining: 0 };
  }

  await logAudit({
    userId: params.userId,
    action: "MODERATOR_ACTION",
    metadata: { action: params.action, countThisHour: count },
    req: params.req,
  });
  return {
    allowed: true,
    revoked: false,
    remaining: Math.max(0, MODERATOR_HOURLY_ACTION_LIMIT - count),
  };
}

import prisma from "@/lib/prisma";

/**
 * Reasonable-security audit logging (DPDP Rule 6).
 *
 * Writes an append-only AuditLog row for consent and data-rights actions, with
 * the requester's IP and user-agent. The row carries `userId` as a plain column
 * (no FK), so it SURVIVES account erasure — we must be able to prove a deletion
 * happened after the user is gone. Logs are purged after one year by
 * /api/admin/audit/purge.
 *
 * Logging is best-effort: a logging failure must never break the request it is
 * recording, so every write is wrapped in a swallowed try/catch (same defensive
 * posture as the rest of the codebase).
 */
export type AuditAction =
  // Authentication events
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "USER_CREATED"
  | "ONBOARDING_COMPLETED"
  | "ONBOARDING_REVOKED"
  | "CONSENT_GRANTED"
  | "CONSENT_WITHDRAWN"
  | "COOKIE_CONSENT_SET"
  | "DATA_EXPORTED"
  | "DATA_REQUEST_CREATED"
  | "DATA_REQUEST_UPDATED"
  | "ERASURE_COMPLETED"
  | "PARENTAL_CONSENT_REQUESTED"
  | "PARENTAL_CONSENT_VERIFIED"
  | "POLICY_ACCEPTED"
  // Admin / moderator actions
  | "QUESTION_DELETED"
  | "QUESTION_DELETE_BLOCKED"
  | "ROLE_CHANGED"
  | "STAFF_ROLE_REVOKED"
  | "USER_SUSPENDED"
  | "USER_RESTORED"
  | "MODERATOR_ACTION"
  | "NOTIFICATION_BROADCAST"
  | "ISSUE_UPDATED"
  | "FEEDBACK_RESOLVED"
  | "FEEDBACK_STATUS_CHANGED"
  | "FEEDBACK_DELETED"
  | "APPLICATION_REVIEWED"
  | "FEATURE_REQUEST_STATUS_CHANGED"
  | "FEATURE_REQUEST_DELETED"
  | "NOTIFICATION_UPDATED"
  | "NOTIFICATION_DELETED";

/** Pulls the caller's IP and user-agent from a request's headers. */
export function requestMeta(req: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const xff = req.headers.get("x-forwarded-for");
  const ipAddress = xff ? xff.split(",")[0]!.trim() : req.headers.get("x-real-ip");
  return { ipAddress: ipAddress || null, userAgent: req.headers.get("user-agent") };
}

export async function logAudit(params: {
  userId?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  try {
    const meta = params.req
      ? requestMeta(params.req)
      : { ipAddress: null, userAgent: null };
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        metadata: (params.metadata ?? undefined) as object | undefined,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log:", error);
  }
}

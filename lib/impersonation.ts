import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Support impersonation ("act as user") — STRONGLY guarded.
 *
 * State lives in a short-lived, HMAC-signed httpOnly cookie (never client-
 * readable, never tamperable). The payload binds the impersonation to the REAL
 * admin who started it, plus the target and an absolute expiry, so:
 *   - the session overlay (lib/auth.ts getCurrentSession) only activates when the
 *     cookie's realUserId matches the actually-authenticated admin;
 *   - it auto-expires (time-boxed) even if "Stop" is never clicked;
 *   - it can never elevate privilege — the overlay carries `impersonatedBy`, and
 *     privileged guards (requireRole) refuse to act while it is set.
 *
 * The cookie is signed, not encrypted: it contains no secret, only ids the admin
 * already knows. Tampering is what we defend against, and the HMAC does that.
 */

export const IMPERSONATION_COOKIE = "imp";
export const IMPERSONATION_MAX_MS = 30 * 60 * 1000; // absolute cap: 30 minutes

export interface ImpersonationPayload {
  /** The real admin who initiated impersonation. */
  realUserId: string;
  /** The user being impersonated. */
  targetUserId: string;
  /** Absolute expiry (epoch ms). */
  exp: number;
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(body: string): string {
  return b64url(createHmac("sha256", secret()).update(body).digest());
}

/** Produce a signed token for the given payload. */
export function signImpersonationToken(payload: ImpersonationPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

/** Verify a token's signature + expiry; returns the payload or null. */
export function verifyImpersonationToken(token: string | undefined | null): ImpersonationPayload | null {
  if (!token || !secret()) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  // Constant-time compare; bail if lengths differ (timingSafeEqual throws otherwise).
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()) as ImpersonationPayload;
    if (
      !payload ||
      typeof payload.realUserId !== "string" ||
      typeof payload.targetUserId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Read + verify the impersonation cookie from the current request. */
export async function readImpersonationCookie(): Promise<ImpersonationPayload | null> {
  try {
    const store = await cookies();
    return verifyImpersonationToken(store.get(IMPERSONATION_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** Cookie options for setting/clearing the impersonation cookie on a response. */
export const impersonationCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

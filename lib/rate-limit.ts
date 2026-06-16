import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Request brakes for abuse-prone endpoints (anti-spam / anti-bot) plus a
 * defense-in-depth CSRF check.
 *
 * Rate limiting uses Upstash Redis when configured (durable + shared across
 * serverless instances). When it isn't, it falls back to a best-effort
 * in-memory sliding window so there's still a brake on a single warm instance
 * and in local dev. The limiter NEVER throws into the handler — on any error it
 * fails open, so a Redis blip can't take an endpoint down.
 */

export interface RateWindow {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// One Ratelimit instance per (limit, window) combination.
const upstashLimiters = new Map<string, Ratelimit>();
function upstashLimiter(w: RateWindow): Ratelimit {
  const key = `${w.limit}:${w.windowSec}`;
  let rl = upstashLimiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(w.limit, `${w.windowSec} s`),
      prefix: "rl",
      analytics: false,
    });
    upstashLimiters.set(key, rl);
  }
  return rl;
}

// In-memory fallback: id -> recent hit timestamps (ms).
const memHits = new Map<string, number[]>();
function memAllow(id: string, w: RateWindow): boolean {
  const now = Date.now();
  const windowMs = w.windowSec * 1000;
  const recent = (memHits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= w.limit) {
    memHits.set(id, recent);
    return false;
  }
  recent.push(now);
  memHits.set(id, recent);
  if (memHits.size > 10_000) memHits.clear(); // crude unbounded-growth guard
  return true;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Enforce a rate limit. `key` namespaces the bucket (e.g. "contact"); the
 * identifier (default: client IP) is appended. Returns a ready-to-return 429
 * NextResponse when the caller is over the limit, or null when allowed.
 *
 * Usage:
 *   const limited = await rateLimit(req, "contact", { limit: 3, windowSec: 300 });
 *   if (limited) return limited;
 */
export async function rateLimit(
  req: Request,
  key: string,
  window: RateWindow,
  identifier?: string
): Promise<NextResponse | null> {
  const id = `${key}:${identifier ?? clientIp(req)}`;
  let allowed = true;
  try {
    allowed = redis ? (await upstashLimiter(window).limit(id)).success : memAllow(id, window);
  } catch {
    allowed = true; // fail open — never break the route on limiter failure
  }
  if (allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(window.windowSec) } }
  );
}

/**
 * Defense-in-depth CSRF guard for state-changing requests: reject when the
 * Origin (or, failing that, Referer) is cross-origin. SameSite=Lax session
 * cookies already block most cross-site POSTs; this closes the remainder for
 * browser-driven form/fetch endpoints. Returns a 403 NextResponse or null.
 *
 * Only use on endpoints whose clients are always the site's own browser pages —
 * not on machine-to-machine routes (cron/webhooks) which may send no Origin.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const host = req.headers.get("host");
  if (!host) return null;

  const sourceHost = (() => {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        return new URL(origin).host;
      } catch {
        return "__bad__";
      }
    }
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).host;
      } catch {
        return "__bad__";
      }
    }
    return null; // neither header — allow (cookies are SameSite=Lax)
  })();

  if (sourceHost !== null && sourceHost !== host) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }
  return null;
}

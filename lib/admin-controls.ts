import "server-only";
import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { writeEdgeFlags } from "@/lib/edge-flags";
import {
  getAppConfig,
  isFeatureEnabled,
  isIpBanned,
  FEATURE_KEYS,
  type AppConfig,
  type FeatureKey,
} from "@/lib/app-config";

/**
 * Push the edge-critical subset of the config into the Upstash mirror so the
 * middleware (and the edge AI route) enforce it. Call after every config write.
 * Best-effort — writeEdgeFlags swallows its own errors and is a no-op without
 * Upstash, in which case the Node-layer guards remain authoritative.
 */
export async function syncEdgeMirror(config: AppConfig): Promise<void> {
  const featuresOff = FEATURE_KEYS.filter(({ key }) => config.features[key] === false).map(
    ({ key }) => key as string
  );
  await writeEdgeFlags({
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    maintenanceAllowIps: config.maintenanceAllowIps,
    ipBanList: config.ipBanList,
    featuresOff,
    aiFallbackForced: config.aiFallbackForced,
  });
}

/**
 * Node-runtime enforcement guards for the operational controls. Each returns a
 * ready-to-return NextResponse when the request should be rejected, or null when
 * it may proceed — the same ergonomics as requireAdmin()/rateLimit():
 *
 *   const ro = await assertWritable(); if (ro) return ro;
 *
 * These are deliberately separate from the EDGE checks (middleware via
 * lib/edge-flags): the edge mirror is a fast-path that only works when Upstash
 * is configured, whereas these run wherever Prisma is available and are the
 * authoritative gate.
 */

/** 503 when read-only mode is on. Apply to user-facing WRITE routes only — never
 * to the admin config routes (or you couldn't switch it back off). */
export async function assertWritable(config?: AppConfig): Promise<NextResponse | null> {
  const cfg = config ?? (await getAppConfig());
  if (!cfg.readOnlyMode) return null;
  return NextResponse.json(
    { error: "The site is in read-only mode right now. Please try again shortly." },
    { status: 503, headers: { "Retry-After": "120" } }
  );
}

/** 503 when a per-feature kill switch is off. */
export async function requireFeature(
  key: FeatureKey,
  config?: AppConfig
): Promise<NextResponse | null> {
  const cfg = config ?? (await getAppConfig());
  if (isFeatureEnabled(cfg, key)) return null;
  return NextResponse.json(
    { error: "This feature is temporarily unavailable. Please check back soon." },
    { status: 503, headers: { "Retry-After": "300" } }
  );
}

/** 403 when the caller's IP is on the ban list. The edge middleware enforces IP
 * bans site-wide for page requests when Upstash is configured; this is the
 * Node-layer guard for API routes (which the edge matcher excludes) and for the
 * no-Upstash case — call it on abuse-prone endpoints. */
export async function assertNotBanned(
  req: Request,
  config?: AppConfig
): Promise<NextResponse | null> {
  const cfg = config ?? (await getAppConfig());
  if (!isIpBanned(clientIp(req), cfg)) return null;
  return NextResponse.json({ error: "Access denied." }, { status: 403 });
}

/**
 * Apply the admin-configured global (per-IP) and per-user request caps. A limit
 * of 0 disables that tier. `key` namespaces the bucket so unrelated routes don't
 * share a counter.
 */
export async function enforceConfiguredRateLimit(
  req: Request,
  key: string,
  opts?: { userId?: string | null; config?: AppConfig }
): Promise<NextResponse | null> {
  const cfg = opts?.config ?? (await getAppConfig());

  if (cfg.globalRateLimit > 0) {
    const limited = await rateLimit(req, `cfg:${key}:ip`, {
      limit: cfg.globalRateLimit,
      windowSec: cfg.globalRateWindowSec,
    });
    if (limited) return limited;
  }
  if (cfg.perUserRateLimit > 0 && opts?.userId) {
    const limited = await rateLimit(
      req,
      `cfg:${key}:user`,
      { limit: cfg.perUserRateLimit, windowSec: cfg.perUserRateWindowSec },
      opts.userId
    );
    if (limited) return limited;
  }
  return null;
}

/** Gate decision for the Node-layer maintenance screen (used by layouts). */
export function isMaintenanceBlocked(
  config: AppConfig,
  ctx: { ip: string | null; isAdmin: boolean }
): boolean {
  if (!config.maintenanceMode) return false;
  if (ctx.isAdmin) return false;
  if (ctx.ip && config.maintenanceAllowIps.some((a) => a.trim() === ctx.ip!.trim())) return false;
  return true;
}

/** Logs only when the verbose-logging toggle is on. */
export async function verboseLog(...args: unknown[]): Promise<void> {
  try {
    const cfg = await getAppConfig();
    if (cfg.verboseLogging) console.log("[verbose]", ...args);
  } catch {
    /* never throw from a log helper */
  }
}

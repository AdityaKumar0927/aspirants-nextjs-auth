import { Redis } from "@upstash/redis";

/**
 * Edge-readable mirror of the abuse/maintenance flags.
 *
 * The Next.js middleware runs on the EDGE runtime and therefore cannot touch
 * Prisma. To enforce maintenance mode and the IP ban list before a page even
 * renders, the admin API mirrors the edge-critical subset of AppConfig into
 * Upstash Redis (REST — works on both edge and node) under a single key. The
 * middleware reads it from there.
 *
 * Everything here is BEST-EFFORT and fails OPEN: if Upstash isn't configured, or
 * a read/write errors, edge enforcement is simply skipped.
 *
 * IMPORTANT — coverage model. The EDGE path (this mirror + the middleware) is the
 * COMPLETE, site-wide enforcement for maintenance mode and the IP ban list: it
 * covers every matched route before it renders, and it requires Upstash. The
 * Node-layer fallbacks are narrower and apply per-segment / per-route:
 *   - maintenance: enforceMaintenance() in lib/page-guards, called from the
 *     public layout and the major feature segments;
 *   - IP ban: assertNotBanned() (lib/admin-controls) on abuse-prone routes;
 *   - read-only / feature toggles: per-route guards (assertWritable /
 *     requireFeature) and the page guards in lib/page-guards;
 *   - signup gates: the signIn() callback (always Node, Upstash-independent).
 * So WITHOUT Upstash, maintenance/IP-ban hold only where those Node guards are
 * wired — configure Upstash for guaranteed full coverage.
 */

export interface EdgeFlags {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceAllowIps: string[];
  ipBanList: string[];
  /** FeatureKeys that are switched OFF — for edge-runtime routes (e.g. the AI
   * hint endpoint) that can't read Prisma but still need the kill switch. */
  featuresOff: string[];
  /** Force the AI fallback chain (skip the primary provider) — for the edge AI route. */
  aiFallbackForced: boolean;
  /** epoch ms of the last mirror write (debug only). */
  updatedAt: number;
}

const EDGE_FLAGS_KEY = "appflags:v1";

// Accept both the native Upstash env names and the Vercel Marketplace KV ones
// (same convention as lib/rate-limit.ts).
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

/** True when the edge mirror is available (Upstash configured). */
export function edgeFlagsEnabled(): boolean {
  return redis !== null;
}

/** Read the mirrored flags, or null when unavailable / on any error. */
export async function readEdgeFlags(): Promise<EdgeFlags | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get<EdgeFlags>(EDGE_FLAGS_KEY);
    if (!raw || typeof raw !== "object") return null;
    return {
      maintenanceMode: !!raw.maintenanceMode,
      maintenanceMessage: String(raw.maintenanceMessage ?? ""),
      maintenanceAllowIps: Array.isArray(raw.maintenanceAllowIps) ? raw.maintenanceAllowIps : [],
      ipBanList: Array.isArray(raw.ipBanList) ? raw.ipBanList : [],
      featuresOff: Array.isArray(raw.featuresOff) ? raw.featuresOff : [],
      aiFallbackForced: !!raw.aiFallbackForced,
      updatedAt: Number(raw.updatedAt ?? 0),
    };
  } catch {
    return null;
  }
}

/** Mirror the edge-critical flags. Best-effort; swallows its own errors. */
export async function writeEdgeFlags(flags: Omit<EdgeFlags, "updatedAt">): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(EDGE_FLAGS_KEY, { ...flags, updatedAt: Date.now() } satisfies EdgeFlags);
  } catch {
    // ignore — Node-layer guards remain authoritative
  }
}

import "server-only";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAppConfig, isFeatureEnabled, type FeatureKey } from "@/lib/app-config";
import { isMaintenanceBlocked } from "@/lib/admin-controls";
import { getCurrentSession } from "@/lib/auth";

/**
 * Server-component page/layout guards. Because this app has NO single root
 * layout (each top-level route group declares its own <html>), the edge
 * middleware (backed by the Upstash flag mirror) is the complete, authoritative
 * maintenance/feature enforcement path. These helpers are the Node-layer
 * fallback that works even WITHOUT Upstash — drop them at the top of a server
 * layout/page so the gate still applies on that segment when the edge mirror is
 * unavailable.
 */

/** Redirect non-admin, non-allowlisted viewers to /maintenance while it's on. */
export async function enforceMaintenance(): Promise<void> {
  const config = await getAppConfig();
  if (!config.maintenanceMode) return;
  const session = await getCurrentSession();
  if (session?.user?.role === "administrator") return; // admins always bypass
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for")?.split(",")[0] || hdrs.get("x-real-ip") || "").trim();
  if (isMaintenanceBlocked(config, { ip, isAdmin: false })) redirect("/maintenance");
}

/** 404 the page when a per-feature kill switch is off. */
export async function enforceFeature(key: FeatureKey): Promise<void> {
  const config = await getAppConfig();
  if (!isFeatureEnabled(config, key)) notFound();
}

/** Convenience: run both guards for a feature segment. */
export async function guardFeaturePage(key: FeatureKey): Promise<void> {
  await enforceMaintenance();
  await enforceFeature(key);
}

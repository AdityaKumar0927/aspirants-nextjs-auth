import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";

export { FEATURE_KEYS, type FeatureKey };

/**
 * Operational control panel config (kill switches, feature flags, rate limits,
 * abuse controls, business rules, security + support toggles). Single source of
 * truth for server-side enforcement. Backed by the single-row AppConfig table
 * (id = 1). The admin settings page edits it via PATCH /api/admin/app-config.
 *
 * getAppConfig() is wrapped in React `cache()` so the many callers in one render
 * share a single DB query, but it is NOT cached across requests — so an admin
 * change is reflected on the very next request, no redeploy/revalidate needed
 * (same semantics as getSiteName). It fails SOFT to DEFAULT_APP_CONFIG when the
 * table is missing (before `npm run db:push`) or on any DB error, so it's safe
 * to call during build-time prerender, in middleware-adjacent server code, and
 * in route guards.
 */

export interface AppConfig {
  // Kill switches & feature flags
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceAllowIps: string[];
  readOnlyMode: boolean;
  registrationOpen: boolean;
  features: Partial<Record<FeatureKey, boolean>>;
  aiFallbackForced: boolean;

  // Rate limits & abuse
  globalRateLimit: number;
  globalRateWindowSec: number;
  perUserRateLimit: number;
  perUserRateWindowSec: number;
  signupThrottleLimit: number;
  signupThrottleWindowSec: number;
  emailDomainBlocklist: string[];
  ipBanList: string[];
  captchaEnabled: boolean;

  // Business rules
  freeQuestionsPerDay: number;
  freePdfUploadsPerMonth: number;
  trialDays: number;
  promoCodesEnabled: boolean;
  pricingVisible: boolean;

  // Security
  requireEmailVerification: boolean;
  sessionTimeoutMin: number;
  adminAllowlist: string[];
  sessionsValidFrom: Date | null;

  // Support / debug
  verboseLogging: boolean;
  adminErrorVisibility: boolean;
  impersonationEnabled: boolean;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  maintenanceMode: false,
  maintenanceMessage: "We're doing some quick maintenance and will be back shortly.",
  maintenanceAllowIps: [],
  readOnlyMode: false,
  registrationOpen: true,
  features: {},
  aiFallbackForced: false,

  globalRateLimit: 0,
  globalRateWindowSec: 60,
  perUserRateLimit: 0,
  perUserRateWindowSec: 60,
  signupThrottleLimit: 0,
  signupThrottleWindowSec: 3600,
  emailDomainBlocklist: [],
  ipBanList: [],
  captchaEnabled: false,

  freeQuestionsPerDay: 0,
  freePdfUploadsPerMonth: 0,
  trialDays: 0,
  promoCodesEnabled: false,
  pricingVisible: true,

  requireEmailVerification: false,
  sessionTimeoutMin: 0,
  adminAllowlist: [],
  sessionsValidFrom: null,

  verboseLogging: false,
  adminErrorVisibility: false,
  impersonationEnabled: true,
};

/** Coerce the raw `features` JSON column into a typed, boolean-only record. */
function normalizeFeatures(raw: unknown): Partial<Record<FeatureKey, boolean>> {
  const out: Partial<Record<FeatureKey, boolean>> = {};
  if (raw && typeof raw === "object") {
    for (const { key } of FEATURE_KEYS) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof v === "boolean") out[key] = v;
    }
  }
  return out;
}

// Shape of the Prisma row (kept loose so this module doesn't hard-depend on the
// generated type before `prisma generate` has run).
type AppConfigRow = {
  [K in keyof AppConfig]: K extends "features" ? unknown : AppConfig[K];
};

function fromRow(row: AppConfigRow): AppConfig {
  return {
    ...DEFAULT_APP_CONFIG,
    ...row,
    features: normalizeFeatures(row.features),
  };
}

export const getAppConfig = cache(async (): Promise<AppConfig> => {
  try {
    const row = await prisma.appConfig.findUnique({ where: { id: 1 } });
    if (!row) return DEFAULT_APP_CONFIG;
    return fromRow(row as unknown as AppConfigRow);
  } catch {
    return DEFAULT_APP_CONFIG;
  }
});

/** A feature is enabled unless explicitly toggled off. */
export function isFeatureEnabled(config: AppConfig, key: FeatureKey): boolean {
  return config.features[key] !== false;
}

/** Case-insensitive domain-blocklist check for an email address. */
export function isEmailDomainBlocked(email: string, config: AppConfig): boolean {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return false;
  return config.emailDomainBlocklist.some((d) => d.trim().toLowerCase() === domain);
}

/** Exact-match IP-ban check (IPs are normalised/trimmed on save). */
export function isIpBanned(ip: string | null | undefined, config: AppConfig): boolean {
  if (!ip) return false;
  const norm = ip.trim();
  return config.ipBanList.some((b) => b.trim() === norm);
}

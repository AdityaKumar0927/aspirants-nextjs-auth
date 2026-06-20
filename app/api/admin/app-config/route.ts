import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getAppConfig, FEATURE_KEYS, type FeatureKey } from "@/lib/app-config";
import { syncEdgeMirror } from "@/lib/admin-controls";
import { cleanText } from "@/lib/clean-text";

/**
 * The operational control panel API.
 *   GET   -> the full AppConfig (admin only).
 *   PATCH -> partial update. Server-side validated, audited (with a before/after
 *           diff), and mirrored to the edge flags. Dangerous transitions
 *           (maintenance ON, read-only ON, registration OFF) require a step-up
 *           confirmation (`confirm: true`) and the super-admin guard.
 *
 * Security posture: deny-by-default (requireAdmin re-checks the role against the
 * DB on every call), CSRF (same-origin), rate-limited, and every admin-editable
 * string is rendered as TEXT downstream (never dangerouslySetInnerHTML), so the
 * message/IP/domain fields are not stored-XSS vectors. We still strip control
 * characters and cap lengths here as defense in depth.
 */

// A feature is ON unless explicitly false; the UI sends the complete map.
const FEATURE_KEY_SET = new Set(FEATURE_KEYS.map((f) => f.key));

/** Accept a string[] OR a newline/comma-separated string; trim, drop empties, dedupe. */
const stringList = z.preprocess((v) => {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\n,]/) : [];
  return Array.from(new Set(arr.map((s) => String(s).trim()).filter(Boolean)));
}, z.array(z.string().max(255)).max(2000));

/** Plain-text field: strip control chars (incl. CR/LF), collapse runs of
 * whitespace, and cap length. Rendered as text downstream, never as HTML. */
const plainText = (max: number) =>
  z.preprocess((v) => cleanText(v, max), z.string().max(max));

const featuresSchema = z.preprocess((v) => {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, boolean> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (FEATURE_KEY_SET.has(k as FeatureKey) && typeof val === "boolean") out[k] = val;
  }
  return out;
}, z.record(z.string(), z.boolean()));

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

const patchSchema = z
  .object({
    // Kill switches & feature flags
    maintenanceMode: z.boolean(),
    maintenanceMessage: plainText(500),
    maintenanceAllowIps: stringList,
    readOnlyMode: z.boolean(),
    registrationOpen: z.boolean(),
    features: featuresSchema,
    aiFallbackForced: z.boolean(),
    // Rate limits & abuse
    globalRateLimit: int(0, 1_000_000),
    globalRateWindowSec: int(1, 86_400),
    perUserRateLimit: int(0, 1_000_000),
    perUserRateWindowSec: int(1, 86_400),
    signupThrottleLimit: int(0, 1_000_000),
    signupThrottleWindowSec: int(1, 604_800),
    emailDomainBlocklist: stringList,
    ipBanList: stringList,
    captchaEnabled: z.boolean(),
    // Business rules
    freeQuestionsPerDay: int(0, 1_000_000),
    freePdfUploadsPerMonth: int(0, 1_000_000),
    trialDays: int(0, 3_650),
    promoCodesEnabled: z.boolean(),
    pricingVisible: z.boolean(),
    // Security
    requireEmailVerification: z.boolean(),
    sessionTimeoutMin: int(0, 525_600),
    adminAllowlist: stringList,
    // Support / debug
    verboseLogging: z.boolean(),
    adminErrorVisibility: z.boolean(),
    impersonationEnabled: z.boolean(),
  })
  .partial();

type Patch = z.infer<typeof patchSchema>;

// Transitions that require an explicit step-up confirmation from the client.
function needsStepUp(before: Awaited<ReturnType<typeof getAppConfig>>, patch: Patch): boolean {
  return (
    (patch.maintenanceMode === true && !before.maintenanceMode) ||
    (patch.readOnlyMode === true && !before.readOnlyMode) ||
    (patch.registrationOpen === false && before.registrationOpen)
  );
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json({ config: await getAppConfig() });
}

export async function PATCH(req: NextRequest) {
  // Dangerous transitions use the super-admin guard (also blocks impersonation).
  const { session, response } = await requireSuperAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "app-config", { limit: 30, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const confirm = (body as { confirm?: unknown }).confirm === true;

  let patch: Patch;
  try {
    patch = patchSchema.parse(body);
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: msg ?? "Invalid settings" }, { status: 400 });
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const before = await getAppConfig();
  if (needsStepUp(before, patch) && !confirm) {
    return NextResponse.json(
      { error: "confirmation_required", message: "This change needs an explicit confirmation." },
      { status: 428 } // Precondition Required
    );
  }

  // Lowercase the domain blocklist + admin allowlist for case-insensitive matching.
  if (patch.emailDomainBlocklist) patch.emailDomainBlocklist = patch.emailDomainBlocklist.map((d) => d.toLowerCase());
  if (patch.adminAllowlist) patch.adminAllowlist = patch.adminAllowlist.map((e) => e.toLowerCase());

  const data = { ...patch, updatedBy: session.user.id };
  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  // NOTE: getAppConfig() is React cache()-memoized for the lifetime of THIS
  // request, so calling it again here would return the pre-write `before`
  // object (no invalidation API) — silently emptying the audit diff, mirroring
  // the stale config to the edge, and reverting the UI. Build the post-write
  // view from the validated patch instead (the DB write used the same values).
  const after = { ...before, ...patch } as typeof before;
  await syncEdgeMirror(after);

  // Audit: the changed keys with before/after, plus targeted high-signal events.
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  const beforeRec = before as unknown as Record<string, unknown>;
  const afterRec = after as unknown as Record<string, unknown>;
  for (const key of Object.keys(patch) as (keyof Patch)[]) {
    const from = beforeRec[key];
    const to = afterRec[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) changed[key] = { from, to };
  }
  await logAudit({ userId: session.user.id, action: "APP_CONFIG_UPDATED", metadata: { changed }, req });
  if ("maintenanceMode" in changed)
    await logAudit({ userId: session.user.id, action: "MAINTENANCE_MODE_CHANGED", metadata: { to: after.maintenanceMode }, req });
  if ("readOnlyMode" in changed)
    await logAudit({ userId: session.user.id, action: "READ_ONLY_MODE_CHANGED", metadata: { to: after.readOnlyMode }, req });
  if ("registrationOpen" in changed)
    await logAudit({ userId: session.user.id, action: "REGISTRATION_TOGGLED", metadata: { to: after.registrationOpen }, req });
  if ("features" in changed)
    await logAudit({ userId: session.user.id, action: "FEATURE_TOGGLED", metadata: { features: after.features }, req });

  return NextResponse.json({ config: after });
}

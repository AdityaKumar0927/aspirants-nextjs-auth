import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { logAudit, requestMeta } from "@/lib/audit";
import { CONSENT_VERSION } from "@/lib/constants";
import type { ConsentPurpose } from "@prisma/client";

/**
 * Persists a cookie/analytics consent choice. Works for logged-out visitors
 * (the first-party cookie is authoritative) and, for signed-in users, also
 * mirrors the choice to User.analyticsConsent + appends ConsentRecord rows so
 * the privacy dashboard and audit trail stay in sync.
 */
const bodySchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const session = await getCurrentSession();
  const res = NextResponse.json({ ok: true });

  // Re-affirm the cookie server-side (defense in depth alongside the client write).
  res.cookies.set("dpdp-consent", JSON.stringify(parsed), {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  if (session?.user?.id) {
    const userId = session.user.id;
    const meta = requestMeta(req);
    // Minors never get analytics/marketing regardless of what the client sends.
    const isMinor = session.user.isMinor === true;
    const analytics = isMinor ? false : parsed.analytics;
    const marketing = isMinor ? false : parsed.marketing;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { analyticsConsent: analytics },
      }),
      prisma.consentRecord.createMany({
        data: (
          [
            { userId, purpose: "ANALYTICS", granted: analytics },
            { userId, purpose: "MARKETING", granted: marketing },
          ] as { userId: string; purpose: ConsentPurpose; granted: boolean }[]
        ).map((r) => ({
          ...r,
          consentVersion: CONSENT_VERSION,
          source: "cookie-banner",
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        })),
      }),
    ]);

    await logAudit({
      userId,
      action: "COOKIE_CONSENT_SET",
      metadata: { analytics, marketing },
      req,
    });
  }

  return res;
}

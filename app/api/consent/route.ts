import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit, requestMeta } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/rate-limit";
import { CONSENT_VERSION } from "@/lib/constants";
import type { ConsentPurpose } from "@prisma/client";

/**
 * Granular purpose consent management for the privacy dashboard.
 *
 * GET  → current consent per purpose (latest ConsentRecord wins) + full history.
 * POST → grant or withdraw a single purpose by appending a new record.
 *        Withdrawal is symmetric to granting (DPDP: as easy to withdraw as to
 *        give); prior processing is unaffected.
 */

// Purposes a user may toggle themselves. ESSENTIAL is required to use the
// service and is not user-withdrawable here.
const TOGGLEABLE: ConsentPurpose[] = ["ANALYTICS", "PROFILING", "MARKETING"];

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const records = await prisma.consentRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Latest record per purpose = current state.
  const current: Record<string, boolean> = {};
  for (const r of records) {
    if (!(r.purpose in current)) current[r.purpose] = r.granted;
  }

  const res = NextResponse.json({ current, history: records });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const postSchema = z.object({
  purpose: z.enum(["ANALYTICS", "PROFILING", "MARKETING"]),
  granted: z.boolean(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const userId = session.user.id;

  let parsed;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Minors may never grant non-essential consent (Rule 10).
  const granted =
    session.user.isMinor === true ? false : parsed.granted;
  const meta = requestMeta(req);

  // Append the record and keep the denormalised analytics flag in step in one
  // transaction so the two can't drift apart on a partial failure.
  await prisma.$transaction(async (tx) => {
    await tx.consentRecord.create({
      data: {
        userId,
        purpose: parsed.purpose,
        consentVersion: CONSENT_VERSION,
        granted,
        source: "privacy-dashboard",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    // Keep the denormalised analytics flag in step for the analytics gate.
    if (parsed.purpose === "ANALYTICS") {
      await tx.user.update({
        where: { id: userId },
        data: { analyticsConsent: granted },
      });
    }
  });

  await logAudit({
    userId,
    action: granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
    metadata: { purpose: parsed.purpose },
    req,
  });

  return NextResponse.json({ ok: true, purpose: parsed.purpose, granted });
}

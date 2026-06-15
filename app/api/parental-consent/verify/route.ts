import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/audit";
import { hashToken } from "@/lib/parental-consent";
import { CONSENT_VERSION } from "@/lib/constants";

/**
 * PUBLIC, token-authenticated endpoint. The parent confirms (an affirmative
 * click on the verify page POSTs here) → the matching ParentalConsent is marked
 * VERIFIED and an ESSENTIAL ConsentRecord is written on the child's behalf.
 * The child's JWT picks up parentalConsentOk on its next re-sync / update().
 */
const bodySchema = z.object({ token: z.string().min(16) });

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.token);
  const record = await prisma.parentalConsent.findFirst({ where: { tokenHash } });

  if (!record) {
    return NextResponse.json(
      { error: "This approval link is invalid." },
      { status: 404 }
    );
  }
  if (record.status === "VERIFIED") {
    return NextResponse.json({ ok: true, status: "VERIFIED" });
  }
  if (record.expiresAt < new Date()) {
    await prisma.parentalConsent.update({
      where: { id: record.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "This approval link has expired. Please ask your child to resend it." },
      { status: 410 }
    );
  }

  const meta = requestMeta(req);
  await prisma.$transaction([
    prisma.parentalConsent.update({
      where: { id: record.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    }),
    prisma.consentRecord.create({
      data: {
        userId: record.userId,
        purpose: "ESSENTIAL",
        consentVersion: CONSENT_VERSION,
        granted: true,
        source: "parental",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    }),
  ]);

  await logAudit({
    userId: record.userId,
    action: "PARENTAL_CONSENT_VERIFIED",
    metadata: { parentEmail: record.parentEmail },
    req,
  });

  return NextResponse.json({ ok: true, status: "VERIFIED" });
}

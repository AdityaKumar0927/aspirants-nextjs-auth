import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/audit";
import { createAndSendParentalConsent } from "@/lib/parental-consent";
import { CONSENT_VERSION, MINOR_AGE_THRESHOLD } from "@/lib/constants";
import type { ConsentPurpose } from "@prisma/client";

/**
 * Completes DPDP onboarding for the signed-in user:
 *  - records self-declared date of birth and derives minor status,
 *  - records acceptance of the (mandatory) terms + privacy notice,
 *  - records granular purpose consents (analytics / profiling / marketing) —
 *    forced OFF for minors (no profiling/targeting of children, Rule 10),
 *  - for minors, kicks off the verifiable parental-consent email flow.
 *
 * The middleware gate is released once onboardingComplete is true AND (for
 * minors) parental consent is VERIFIED. The client should call session
 * update() after a successful response so the JWT flags refresh immediately.
 */
const bodySchema = z.object({
  dateOfBirth: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date of birth"),
  acceptTerms: z.literal(true, { error: "You must accept the Terms of Service." }),
  acceptPrivacy: z.literal(true, {
    error: "You must accept the Privacy Policy and consent notice.",
  }),
  consents: z
    .object({
      analytics: z.boolean().optional(),
      profiling: z.boolean().optional(),
      marketing: z.boolean().optional(),
    })
    .default({}),
  parentEmail: z.string().email().optional(),
  parentName: z.string().max(100).optional(),
});

function ageInYears(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const dob = new Date(parsed.dateOfBirth);
  if (dob > new Date()) {
    return NextResponse.json(
      { error: "Date of birth cannot be in the future." },
      { status: 400 }
    );
  }
  const isMinor = ageInYears(dob) < MINOR_AGE_THRESHOLD;

  if (isMinor && !parsed.parentEmail) {
    return NextResponse.json(
      { error: "A parent or guardian email is required for users under 18." },
      { status: 400 }
    );
  }

  // Minors never grant analytics/profiling/marketing consent (Rule 10).
  const analytics = isMinor ? false : !!parsed.consents.analytics;
  const profiling = isMinor ? false : !!parsed.consents.profiling;
  const marketing = isMinor ? false : !!parsed.consents.marketing;

  const meta = requestMeta(req);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        dateOfBirth: dob,
        isMinor,
        onboardingComplete: true,
        analyticsConsent: analytics,
        updatedAt: now,
      },
    });

    // Simple policy acceptance booleans (terms / privacy).
    for (const policyName of ["terms", "privacy"]) {
      await tx.userPolicyAgreement.upsert({
        where: { userId_policyName: { userId, policyName } },
        update: { accepted: true, acceptedAt: now },
        create: { userId, policyName, accepted: true, acceptedAt: now },
      });
    }

    // Append granular, versioned purpose consents.
    const records: { purpose: ConsentPurpose; granted: boolean }[] = [
      { purpose: "ESSENTIAL", granted: true },
      { purpose: "ANALYTICS", granted: analytics },
      { purpose: "PROFILING", granted: profiling },
      { purpose: "MARKETING", granted: marketing },
    ];
    await tx.consentRecord.createMany({
      data: records.map((r) => ({
        userId,
        purpose: r.purpose,
        consentVersion: CONSENT_VERSION,
        granted: r.granted,
        source: "onboarding",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })),
    });
  });

  if (isMinor && parsed.parentEmail) {
    await createAndSendParentalConsent({
      userId,
      childName: session.user.name ?? session.user.email ?? "Your child",
      parentEmail: parsed.parentEmail,
      parentName: parsed.parentName ?? null,
      req,
    });
  }

  await logAudit({
    userId,
    action: "ONBOARDING_COMPLETED",
    metadata: { isMinor, analytics, profiling, marketing },
    req,
  });

  return NextResponse.json({ ok: true, isMinor, awaitingParentalConsent: isMinor });
}

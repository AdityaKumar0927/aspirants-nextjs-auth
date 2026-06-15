import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendParentalConsentEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

/** Parental-consent token lifetime. */
const TOKEN_TTL_DAYS = 7;

/** Base URL used to build the verification link inside the parent's email. */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

/**
 * Creates (or refreshes) a pending ParentalConsent for a minor and emails the
 * verification link to the parent. Only the SHA-256 hash of the token is stored;
 * the raw token lives only in the emailed URL.
 *
 * Returns the raw verify URL so callers can surface it in development when no
 * mail provider is configured.
 */
export async function createAndSendParentalConsent(params: {
  userId: string;
  childName: string;
  parentEmail: string;
  parentName?: string | null;
  req?: Request;
}): Promise<{ verifyUrl: string }> {
  const { userId, childName, parentEmail, parentName, req } = params;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.parentalConsent.upsert({
    where: { userId },
    update: {
      parentEmail,
      parentName: parentName ?? null,
      tokenHash,
      status: "PENDING",
      requestedAt: new Date(),
      verifiedAt: null,
      expiresAt,
    },
    create: {
      userId,
      parentEmail,
      parentName: parentName ?? null,
      tokenHash,
      status: "PENDING",
      expiresAt,
    },
  });

  const verifyUrl = `${appBaseUrl()}/parental-consent/verify?token=${rawToken}`;
  await sendParentalConsentEmail({ parentEmail, childName, verifyUrl });
  await logAudit({
    userId,
    action: "PARENTAL_CONSENT_REQUESTED",
    metadata: { parentEmail },
    req,
  });

  return { verifyUrl };
}

/** sha256 hex of a raw token, for matching against the stored hash. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAndSendParentalConsent } from "@/lib/parental-consent";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";

/**
 * Re-sends (or first-sends) the verifiable parental-consent email for the
 * signed-in minor. Rate-limited via the shared limiter (lib/rate-limit), which
 * honors every supported Redis/KV env name AND falls back to an in-memory
 * window when Redis is unconfigured — so a misconfiguration can never silently
 * disable the brake and let a minor mail-bomb the parent's inbox.
 */

const bodySchema = z.object({
  parentEmail: z.string().email(),
  parentName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(
    req,
    "parental-consent",
    { limit: 3, windowSec: 600 },
    userId
  );
  if (limited) return limited;

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

  // Only minors who haven't already been verified need this.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ParentalConsent: true },
  });
  if (!user || user.isMinor !== true) {
    return NextResponse.json(
      { error: "Parental consent is not applicable to this account." },
      { status: 400 }
    );
  }
  if (user.ParentalConsent?.status === "VERIFIED") {
    return NextResponse.json({ ok: true, status: "VERIFIED" });
  }

  // Fail CLOSED in production: if no mail provider is configured we must not
  // complete the flow. Otherwise we'd either (a) silently fail to email the
  // parent (the minor is stuck, un-gated only if consent is never verified), or
  // (b) — via the devLink below — hand the raw verify token straight back to the
  // signed-in minor, who could POST it to /verify and self-approve. Only a
  // non-production environment may surface the link.
  const isProd = process.env.NODE_ENV === "production";
  const mailConfigured = !!process.env.RESEND_API_KEY;
  if (isProd && !mailConfigured) {
    return NextResponse.json(
      { error: "Email delivery is not configured. Please contact support." },
      { status: 500 }
    );
  }

  const { verifyUrl } = await createAndSendParentalConsent({
    userId,
    childName: user.name ?? user.email ?? "Your child",
    parentEmail: parsed.parentEmail,
    parentName: parsed.parentName ?? null,
    req,
  });

  // Outside production ONLY (and only when no mail provider is configured),
  // expose the link so the flow can be tested locally. DOUBLE-GATED on NODE_ENV
  // like the dev-login provider — in production this is always undefined, so the
  // token reaches the parent's inbox exclusively, never the minor's response.
  const devLink = !isProd && !mailConfigured ? verifyUrl : undefined;
  return NextResponse.json({ ok: true, status: "PENDING", devLink });
}

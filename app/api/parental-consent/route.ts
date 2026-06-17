import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAndSendParentalConsent } from "@/lib/parental-consent";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Re-sends (or first-sends) the verifiable parental-consent email for the
 * signed-in minor. Rate-limited to stop a parent's inbox being flooded. If
 * Upstash is not configured (local dev) the limiter is skipped so the flow stays
 * testable.
 */
const limiter =
  process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.REDIS_URL,
          token: process.env.REDIS_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(3, "10 m"),
        analytics: true,
      })
    : null;

const bodySchema = z.object({
  parentEmail: z.string().email(),
  parentName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  if (limiter) {
    const { success } = await limiter.limit(`parental-consent:${userId}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

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

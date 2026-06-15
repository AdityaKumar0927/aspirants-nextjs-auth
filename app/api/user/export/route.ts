import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Data-principal right of access / portability (DPDP s.11): returns a complete,
 * machine-readable copy of the user's personal data as a downloadable JSON file.
 * OAuth tokens are deliberately excluded — they are credentials, not personal
 * data the principal needs exported, and leaking them would be a risk.
 */
const limiter =
  process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.REDIS_URL,
          token: process.env.REDIS_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
      })
    : null;

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  if (limiter) {
    const { success } = await limiter.limit(`export:${userId}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const [
    user,
    accounts,
    settings,
    progress,
    answers,
    performance,
    notes,
    feedback,
    applications,
    aiUsage,
    mockExams,
    consents,
    dataRequests,
    parentalConsent,
    policyAgreements,
    notifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        dateOfBirth: true,
        isMinor: true,
        subscribed: true,
        roleId: true,
        subscriptionTier: true,
        onboardingComplete: true,
        analyticsConsent: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true, providerAccountId: true },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.userAnswer.findMany({ where: { userId } }),
    prisma.userPerformance.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.feedback.findMany({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
    prisma.aiUsageLog.findMany({ where: { userId } }),
    prisma.userMockExam.findMany({ where: { userId } }),
    prisma.consentRecord.findMany({ where: { userId } }),
    prisma.dataRequest.findMany({ where: { userId } }),
    prisma.parentalConsent.findUnique({
      where: { userId },
      select: {
        parentEmail: true,
        parentName: true,
        status: true,
        requestedAt: true,
        verifiedAt: true,
      },
    }),
    prisma.userPolicyAgreement.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      "This file contains the personal data Penwise holds about you (DPDP Act, right of access). OAuth credentials are excluded.",
    user,
    accounts,
    settings,
    studyProgress: progress,
    answers,
    performance,
    notes,
    feedback,
    applications,
    aiUsage,
    mockExams,
    consents,
    dataRequests,
    parentalConsent,
    policyAgreements,
    notifications,
  };

  await logAudit({ userId, action: "DATA_EXPORTED", req });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="aspirants-data-${userId}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}

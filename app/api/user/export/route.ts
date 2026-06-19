import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteName } from "@/lib/site-config";

/**
 * Data-principal right of access / portability (DPDP s.11): returns a complete,
 * machine-readable copy of the user's personal data as a downloadable JSON file.
 * OAuth tokens are deliberately excluded — they are credentials, not personal
 * data the principal needs exported, and leaking them would be a risk.
 */
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  // Shared limiter (honors all Redis/KV env names + in-memory fallback) so a
  // KV-only deploy can't silently run this PII dump endpoint un-throttled.
  const limited = await rateLimit(
    req,
    "data-export",
    { limit: 5, windowSec: 600 },
    userId
  );
  if (limited) return limited;

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
    userBanks,
    issues,
    authoredSolutions,
    solutionLikes,
    featureRequests,
    featureRequestComments,
    featureRequestVotes,
    studyPlan,
    volunteerTasks,
    importJobs,
    moderatorLimit,
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
    // Include the full clarification thread for each of the user's feedback items.
    prisma.feedback.findMany({ where: { userId }, include: { messages: true } }),
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
    prisma.userBank.findMany({
      where: { userId },
      include: { questions: { orderBy: { order: "asc" } } },
    }),
    // User-authored community content + records (DSAR completeness).
    prisma.issue.findMany({ where: { createdById: userId } }),
    prisma.solution.findMany({ where: { authorId: userId } }),
    prisma.solutionLike.findMany({ where: { userId } }),
    prisma.featureRequest.findMany({ where: { createdById: userId } }),
    prisma.featureRequestComment.findMany({ where: { authorId: userId } }),
    prisma.featureRequestVote.findMany({ where: { userId } }),
    prisma.studyPlan.findUnique({ where: { userId } }),
    prisma.volunteerTask.findMany({ where: { volunteerId: userId } }),
    prisma.importJob.findMany({ where: { userId } }),
    prisma.moderatorLimit.findUnique({ where: { userId } }),
  ]);

  const siteName = await getSiteName();
  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      `This file contains the personal data ${siteName} holds about you (DPDP Act, right of access). OAuth credentials are excluded.`,
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
    userBanks,
    issues,
    authoredSolutions,
    solutionLikes,
    featureRequests,
    featureRequestComments,
    featureRequestVotes,
    studyPlan,
    volunteerTasks,
    importJobs,
    moderatorLimit,
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

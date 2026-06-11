import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// UserPerformance feeds only the user's OWN analytics dashboard (the public
// leaderboard is static), so we don't fully recompute it server-side — but we
// DO bound every value so a crafted request can't store absurd numbers or
// bloat the JSON columns.
const count = z.coerce.number().int().min(0).max(1_000_000).default(0);
const ratio = z.coerce.number().min(0).max(100).default(0); // percentages/normalized scores
const boundedJson = z
  .unknown()
  .optional()
  .refine(
    (v) => v === undefined || JSON.stringify(v).length <= 20_000,
    "JSON field too large"
  );

const schema = z.object({
  questionId: z.string().trim().min(1).max(120),
  correctAnswers: count,
  incorrectAnswers: count,
  uniqueQuestions: count,
  questionsAttempted: count,
  timeSpent: z.coerce.number().int().min(0).max(86_400_000).default(0),
  accuracy: ratio,
  attemptRate: ratio,
  firstAttemptSuccessRate: ratio,
  reattemptAccuracy: ratio,
  consistency: ratio,
  engagementLevel: ratio,
  weaknessBySubtopic: boundedJson,
  improvementOverTime: boundedJson,
  topicPerformance: boundedJson,
  completed: z.boolean().default(false),
  reviewed: z.boolean().default(false),
  lastAttempted: z.coerce.date().optional(),
});

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const data = {
      correctAnswers: d.correctAnswers,
      incorrectAnswers: d.incorrectAnswers,
      uniqueQuestions: d.uniqueQuestions,
      questionsAttempted: d.questionsAttempted,
      timeSpent: d.timeSpent,
      accuracy: d.accuracy,
      attemptRate: d.attemptRate,
      firstAttemptSuccessRate: d.firstAttemptSuccessRate,
      reattemptAccuracy: d.reattemptAccuracy,
      consistency: d.consistency,
      engagementLevel: d.engagementLevel,
      weaknessBySubtopic: (d.weaknessBySubtopic ?? {}) as object,
      improvementOverTime: (d.improvementOverTime ?? {}) as object,
      topicPerformance: (d.topicPerformance ?? {}) as object,
      completed: d.completed,
      reviewed: d.reviewed,
      lastAttempted: d.lastAttempted ?? new Date(),
    };

    // Atomic upsert on the unique (userId, questionId): findFirst + create
    // raced on concurrent submits and 500'd on the unique-constraint violation.
    const userPerformance = await prisma.userPerformance.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: d.questionId,
        },
      },
      update: { ...data, updatedAt: new Date() },
      create: {
        userId: session.user.id,
        questionId: d.questionId,
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error("Error updating user performance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

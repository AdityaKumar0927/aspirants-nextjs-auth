import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { cached } from "@/lib/cache";

function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * GET /api/questions/stats
 * e.g. /api/questions/stats?exam=JEE,NEET&subject=Physics&year=2022
 *
 * Only counts ACTIVE questions (never leaks DRAFT/ARCHIVED existence), and
 * completed/reviewed are the CURRENT USER's progress (from UserProgress), not
 * the shared Question row. Guests get 0 for completed/reviewed.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const examArr = parseCommaParam(searchParams.get("exam"));
    const subjectArr = parseCommaParam(searchParams.get("subject"));
    const topicArr = parseCommaParam(searchParams.get("topic"));
    const subtopicArr = parseCommaParam(searchParams.get("subtopic"));
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"));
    const typeArr = parseCommaParam(searchParams.get("type"));
    const yearStrArr = parseCommaParam(searchParams.get("year"));

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (examArr) where.exam = { in: examArr };
    if (subjectArr) where.subject = { in: subjectArr };
    if (topicArr) where.topic = { in: topicArr };
    if (subtopicArr) where.subtopic = { in: subtopicArr };
    if (difficultyArr) where.difficulty = { in: difficultyArr };
    if (typeArr) where.type = { in: typeArr };
    if (yearStrArr) {
      const years = yearStrArr.map((y) => parseInt(y, 10)).filter((n) => !isNaN(n));
      if (years.length) where.year = { in: years };
    }

    const session = await getCurrentSession();
    const userId = session?.user?.id;

    // Cache the three counts for 30s keyed by (user, filters) so repeated
    // calls (and rapid filter changes) don't each run full COUNT scans.
    const cacheKey = `stats:${userId ?? "guest"}:${new URL(request.url).searchParams.toString()}`;
    const [total, completed, reviewed] = await cached(cacheKey, 30_000, () =>
      Promise.all([
        prisma.question.count({ where }),
        userId
          ? prisma.userProgress.count({
              where: { userId, completed: true, Question: where },
            })
          : Promise.resolve(0),
        userId
          ? prisma.userProgress.count({
              where: { userId, reviewed: true, Question: where },
            })
          : Promise.resolve(0),
      ])
    );

    return NextResponse.json({
      total,
      completed,
      reviewed,
      notAnswered: total - completed,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

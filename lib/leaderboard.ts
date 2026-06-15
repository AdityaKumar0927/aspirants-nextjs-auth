import prisma from "@/lib/prisma";
import { cached } from "@/lib/cache";

/**
 * Real practice leaderboard, aggregated from actual study data:
 *  - "solved"   = questions completed (UserProgress.completed = true)
 *  - "attempted"/"accuracy" = answers given / share correct (UserAnswer)
 *
 * Ranked by questions solved. Cached briefly (a leaderboard needn't be
 * real-time) so a burst of guests can't each trigger the group-by scans.
 * Display name prefers the user's chosen handle (UserSettings.username) over
 * their account name, and never exposes email.
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  solved: number;
  attempted: number;
  accuracy: number; // 0..100, one decimal
}

const TOP_N = 50;
const TTL_MS = 60_000;

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return cached("leaderboard:top", TTL_MS, async () => {
    // Rank by questions answered CORRECTLY (UserAnswer.isCorrect). UserProgress
    // ("completed") is not populated in this app, so answers are the real signal
    // of practice. UserAnswer is unique per (user, question), so a correct count
    // == distinct questions solved.
    const correctRows = await prisma.userAnswer.groupBy({
      by: ["userId"],
      where: { isCorrect: true },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: TOP_N,
    });

    const ids = correctRows.map((r) => r.userId);
    if (!ids.length) return [];

    const [attemptedRows, userRows] = await Promise.all([
      prisma.userAnswer.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          image: true,
          UserSettings: { select: { username: true } },
        },
      }),
    ]);

    const attemptedBy = new Map(attemptedRows.map((r) => [r.userId, r._count._all]));
    const userBy = new Map(userRows.map((u) => [u.id, u]));

    return correctRows.map((r, i) => {
      const u = userBy.get(r.userId);
      const solved = r._count.userId;
      const attempted = attemptedBy.get(r.userId) ?? solved;
      return {
        rank: i + 1,
        userId: r.userId,
        name: u?.UserSettings?.username || u?.name || "Aspirant",
        image: u?.image ?? null,
        solved,
        attempted,
        accuracy: attempted > 0 ? Math.round((solved / attempted) * 1000) / 10 : 0,
      };
    });
  });
}

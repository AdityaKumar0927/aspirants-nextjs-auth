import { getServerSession } from "next-auth/next";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import { getLeaderboard } from "@/lib/leaderboard";
import LeaderboardClient from "./leaderboard-client";

// Reads the session (to highlight the viewer) so it's per-request; the heavy
// aggregation underneath is cached in getLeaderboard().
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [entries, session] = await Promise.all([
    getLeaderboard(),
    getServerSession(authOptions),
  ]);

  const asOf = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <LeaderboardClient
      entries={entries}
      meId={session?.user?.id ?? null}
      asOf={asOf}
    />
  );
}

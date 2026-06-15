import prisma from "@/lib/prisma";
import { cached } from "@/lib/cache";

/**
 * Public "known issues" list, derived from the existing Issue tracker — no
 * separate schema. We only surface BUG-area issues the team has TRIAGED:
 *   IN_PROGRESS  → a known, actively-tracked bug
 *   RESOLVED     → recently fixed
 * Raw OPEN reports (possible spam/duplicates) are intentionally excluded, and
 * only public-safe fields are selected (never the reporter's identity).
 */
export interface KnownBug {
  id: string;
  title: string;
  description: string;
  status: "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  updatedAt: string;
}

const TTL_MS = 60_000;

export async function getKnownBugs(): Promise<KnownBug[]> {
  return cached("known-bugs", TTL_MS, async () => {
    const rows = await prisma.issue.findMany({
      where: { area: "BUG", status: { in: ["IN_PROGRESS", "RESOLVED"] } },
      // IssueStatus enum order puts IN_PROGRESS before RESOLVED, so "asc" lists
      // active bugs first; then most-severe, then most-recently-touched.
      orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
      take: 60,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        updatedAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status as KnownBug["status"],
      priority: r.priority as KnownBug["priority"],
      updatedAt: r.updatedAt.toISOString(),
    }));
  });
}

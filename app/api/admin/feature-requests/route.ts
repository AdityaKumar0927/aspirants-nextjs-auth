import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { FeatureRequestStatus } from "@prisma/client";

/**
 * Admin queue of feature requests. Optional ?status= filter; includes vote/
 * comment counts and the submitter so staff can triage and update status.
 */
export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const valid: FeatureRequestStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"];
  const where =
    statusParam && valid.includes(statusParam as FeatureRequestStatus)
      ? { status: statusParam as FeatureRequestStatus }
      : {};

  const rows = await prisma.featureRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 500,
    include: {
      _count: { select: { votes: true, comments: true } },
      createdBy: {
        select: { name: true, email: true, UserSettings: { select: { username: true } } },
      },
    },
  });

  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    category: r.category,
    tags: r.tags,
    votes: r._count.votes,
    comments: r._count.comments,
    submittedBy: r.createdBy?.UserSettings?.username || r.createdBy?.name || "Aspirant",
    submitterEmail: r.createdBy?.email ?? null,
    createdAt: r.createdAt,
  }));

  const res = NextResponse.json(data);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

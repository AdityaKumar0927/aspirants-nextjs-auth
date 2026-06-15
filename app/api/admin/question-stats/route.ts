import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/question-stats  (admin only)
 *
 * Accurate per-status counts for the admin question-bank dashboard — four cheap
 * COUNTs straight from the DB. The dashboard previously derived its "total" from
 * a capped client-side fetch (MAX 10,000), so it under-reported the real bank
 * (38k+ questions) and silently truncated. These counts are always correct.
 */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const [total, active, draft, archived] = await prisma.$transaction([
      prisma.question.count(),
      prisma.question.count({ where: { status: "ACTIVE" } }),
      prisma.question.count({ where: { status: "DRAFT" } }),
      prisma.question.count({ where: { status: "ARCHIVED" } }),
    ]);
    return NextResponse.json({ total, active, draft, archived });
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

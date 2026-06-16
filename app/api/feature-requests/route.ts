import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentSession, requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";

export const CATEGORIES = [
  "UI/UX",
  "Integrations",
  "Performance",
  "Security",
  "Content",
  "Other",
] as const;

// Public list. If signed in, marks which requests the caller has upvoted.
export async function GET() {
  const session = await getCurrentSession();
  const myId = session?.user?.id ?? null;

  const rows = await prisma.featureRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { votes: true, comments: true } },
      createdBy: { select: { name: true, UserSettings: { select: { username: true } } } },
      votes: myId ? { where: { userId: myId }, select: { id: true } } : false,
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
    submittedDate: r.createdAt.toISOString(),
    hasVoted: Array.isArray(r.votes) ? r.votes.length > 0 : false,
  }));

  return NextResponse.json(data);
}

const createSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(140),
  description: z.string().trim().min(20, "Description must be at least 20 characters.").max(4000),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).optional().default([]),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "feature-request", { limit: 5, windowSec: 600 }, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 }
    );
  }

  const fr = await prisma.featureRequest.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      tags: parsed.data.tags,
      createdById: session.user.id,
      // Submitter implicitly upvotes their own request.
      votes: { create: { userId: session.user.id } },
    },
  });

  return NextResponse.json({ id: fr.id }, { status: 201 });
}

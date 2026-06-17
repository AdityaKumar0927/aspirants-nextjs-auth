import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { containsProfanity, PROFANITY_ERROR } from "@/lib/profanity";

// Public read of a request's comments.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await prisma.featureRequestComment.findMany({
    where: { featureRequestId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      author: { select: { name: true, UserSettings: { select: { username: true } } } },
    },
  });
  const data = rows.map((c) => ({
    id: c.id,
    author: c.author?.UserSettings?.username || c.author?.name || "Aspirant",
    content: c.content,
    date: c.createdAt.toISOString(),
  }));
  return NextResponse.json(data);
}

const schema = z.object({ content: z.string().trim().min(2, "Comment is too short.").max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(
    req,
    "feature-request-comment",
    { limit: 10, windowSec: 300 },
    session.user.id
  );
  if (limited) return limited;

  const { id } = await params;

  const exists = await prisma.featureRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid comment." },
      { status: 400 }
    );
  }

  if (containsProfanity(parsed.data.content)) {
    return NextResponse.json({ error: PROFANITY_ERROR }, { status: 400 });
  }

  const created = await prisma.featureRequestComment.create({
    data: { featureRequestId: id, authorId: session.user.id, content: parsed.data.content },
    include: { author: { select: { name: true, UserSettings: { select: { username: true } } } } },
  });

  return NextResponse.json(
    {
      id: created.id,
      author: created.author?.UserSettings?.username || created.author?.name || "Aspirant",
      content: created.content,
      date: created.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

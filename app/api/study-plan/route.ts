import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";

// Server-synced study planner. One row per user; the planner state is stored as
// JSON. Guests (401) fall back to localStorage on the client.

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const row = await prisma.studyPlan.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ data: row?.data ?? null, updatedAt: row?.updatedAt ?? null });
}

const subjectSchema = z.object({
  id: z.number(),
  name: z.string().max(200),
  goal: z.number(),
  progress: z.number(),
});
const sessionSchema = z.object({
  id: z.number(),
  subjectId: z.number(),
  date: z.string().max(40),
  duration: z.number(),
});
const planSchema = z.object({
  subjects: z.array(subjectSchema).max(500),
  studySessions: z.array(sessionSchema).max(5000),
});

export async function PUT(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const csrf = assertSameOrigin(req); if (csrf) return csrf;
  const limited = await rateLimit(req, "study-plan", { limit: 20, windowSec: 60 }, session.user.id); if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan payload." }, { status: 400 });
  }

  const saved = await prisma.studyPlan.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data: parsed.data },
    update: { data: parsed.data },
  });

  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt });
}

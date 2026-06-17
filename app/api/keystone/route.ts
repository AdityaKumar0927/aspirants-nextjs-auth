import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";

/**
 * Keystone shelf sync (signed-in users only).
 *  GET  → the caller's saved lessons/sets (dates as ms epoch, matching the client).
 *  POST → upsert one item, scoped to the caller (IDOR-checked).
 * Guests get 401 and the client silently stays in localStorage-only mode.
 */

const MAX_JSON = 400_000; // ~400KB serialized cap per blob

const sizeOk = (v: unknown) => JSON.stringify(v ?? null).length <= MAX_JSON;

const itemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  mode: z.enum(["learning", "revision"]),
  title: z.string().trim().min(1).max(300),
  subject: z.string().trim().max(200).nullish(),
  data: z.unknown().refine(sizeOk, "data payload too large"),
  progress: z.unknown().nullish().refine(sizeOk, "progress payload too large"),
  reviewCount: z.coerce.number().int().min(0).max(100_000).default(0),
  lastStudiedAt: z.number().nullish(),
  dueAt: z.number().nullish(),
  updatedAt: z.number().nullish(),
});

type Row = {
  id: string;
  mode: string;
  title: string;
  subject: string | null;
  data: Prisma.JsonValue;
  progress: Prisma.JsonValue;
  reviewCount: number;
  lastStudiedAt: Date | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toClient(it: Row) {
  return {
    id: it.id,
    mode: it.mode,
    title: it.title,
    subject: it.subject,
    data: it.data,
    progress: it.progress ?? null,
    reviewCount: it.reviewCount,
    createdAt: it.createdAt.getTime(),
    lastStudiedAt: it.lastStudiedAt ? it.lastStudiedAt.getTime() : null,
    dueAt: it.dueAt ? it.dueAt.getTime() : null,
    updatedAt: it.updatedAt.getTime(),
  };
}

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const rows = await prisma.keystoneItem.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const res = NextResponse.json({ items: rows.map(toClient) });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "keystone-sync", { limit: 120, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  // Cap the raw body BEFORE deserializing (the per-field refines run after).
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 1_200_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const userId = session.user.id;

  // IDOR: never overwrite another user's item with the same id.
  const existing = await prisma.keystoneItem.findUnique({ where: { id: d.id }, select: { userId: true } });
  if (existing && existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const common = {
    mode: d.mode,
    title: d.title,
    subject: d.subject ?? null,
    data: d.data as Prisma.InputJsonValue,
    progress: d.progress == null ? Prisma.JsonNull : (d.progress as Prisma.InputJsonValue),
    reviewCount: d.reviewCount,
    lastStudiedAt: d.lastStudiedAt ? new Date(d.lastStudiedAt) : null,
    dueAt: d.dueAt ? new Date(d.dueAt) : null,
    updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
  };

  await prisma.keystoneItem.upsert({
    where: { id: d.id },
    create: { id: d.id, userId, ...common },
    update: common,
  });

  return NextResponse.json({ ok: true });
}

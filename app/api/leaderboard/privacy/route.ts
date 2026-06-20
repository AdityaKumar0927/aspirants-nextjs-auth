import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertWritable, requireFeature } from "@/lib/admin-controls";

/**
 * The signed-in user's Merit List visibility preferences:
 *   optOut    — hide from the rankings entirely
 *   anonymous — appear, but as "Anonymous" (name + photo hidden)
 *   name      — custom display name (blank ⇒ account name)
 */
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const off = await requireFeature("leaderboard");
  if (off) return off;

  const s = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { leaderboardOptOut: true, leaderboardAnonymous: true, leaderboardName: true },
  });

  const res = NextResponse.json({
    optOut: s?.leaderboardOptOut ?? false,
    anonymous: s?.leaderboardAnonymous ?? false,
    name: s?.leaderboardName ?? "",
  });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const schema = z.object({
  optOut: z.boolean(),
  anonymous: z.boolean(),
  name: z.string().trim().max(40).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const off = await requireFeature("leaderboard");
  if (off) return off;

  const ro = await assertWritable();
  if (ro) return ro;

  let p;
  try {
    p = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const name = p.name && p.name.trim() ? p.name.trim() : null;

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {
      leaderboardOptOut: p.optOut,
      leaderboardAnonymous: p.anonymous,
      leaderboardName: name,
    },
    create: {
      id: crypto.randomUUID(),
      userId: session.user.id,
      username: "",
      email: "",
      bio: "",
      urls: [],
      name: "",
      language: "",
      leaderboardOptOut: p.optOut,
      leaderboardAnonymous: p.anonymous,
      leaderboardName: name,
    },
  });

  return NextResponse.json({ ok: true });
}

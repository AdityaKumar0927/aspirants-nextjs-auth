import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { cleanText } from "@/lib/clean-text";

/**
 * Sitewide announcement banners (admin CRUD).
 *   GET  -> all announcements, newest first (for the admin list).
 *   POST -> create one.
 *
 * The message is stored and rendered as PLAIN TEXT (the banner never uses
 * dangerouslySetInnerHTML), so it is not a stored-XSS vector; cleanText() strips
 * control characters and caps length as defense in depth.
 */

const ISO = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

const createSchema = z.object({
  message: z
    .string()
    .transform((s) => cleanText(s, 400))
    .pipe(z.string().min(1, "Message is required")),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "CRITICAL"]).default("INFO"),
  dismissible: z.boolean().default(true),
  active: z.boolean().default(true),
  startsAt: ISO,
  endsAt: ISO,
  audience: z.string().trim().max(40).default("ALL"),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "announcements", { limit: 20, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  let data;
  try {
    data = createSchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: msg ?? "Invalid announcement" }, { status: 400 });
  }
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    return NextResponse.json({ error: "End time must be after the start time." }, { status: 400 });
  }

  const created = await prisma.announcement.create({
    data: { ...data, createdBy: session.user.id },
  });
  await logAudit({
    userId: session.user.id,
    action: "ANNOUNCEMENT_CREATED",
    metadata: { id: created.id, type: created.type, audience: created.audience },
    req,
  });
  return NextResponse.json({ announcement: created }, { status: 201 });
}

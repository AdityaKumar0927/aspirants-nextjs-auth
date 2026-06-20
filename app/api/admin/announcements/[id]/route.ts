import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { cleanText } from "@/lib/clean-text";

/**
 * A single announcement.
 *   PATCH  -> update fields (commonly just flip `active` on/off).
 *   DELETE -> remove it.
 */

const ISO = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

const patchSchema = z
  .object({
    message: z.string().transform((s) => cleanText(s, 400)).pipe(z.string().min(1)),
    type: z.enum(["INFO", "WARNING", "SUCCESS", "CRITICAL"]),
    dismissible: z.boolean(),
    active: z.boolean(),
    startsAt: ISO,
    endsAt: ISO,
    audience: z.string().trim().max(40),
  })
  .partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "announcements", { limit: 30, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  const { id } = await params;
  let data;
  try {
    data = patchSchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: msg ?? "Invalid update" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  try {
    const updated = await prisma.announcement.update({ where: { id }, data });
    await logAudit({
      userId: session.user.id,
      action: "ANNOUNCEMENT_UPDATED",
      metadata: { id, changed: Object.keys(data) },
      req,
    });
    return NextResponse.json({ announcement: updated });
  } catch {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "announcements", { limit: 30, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  const { id } = await params;
  try {
    await prisma.announcement.delete({ where: { id } });
    await logAudit({ userId: session.user.id, action: "ANNOUNCEMENT_DELETED", metadata: { id }, req });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }
}

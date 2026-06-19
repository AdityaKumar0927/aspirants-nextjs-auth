import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getSiteName } from "@/lib/site-config";

/**
 * Admin site configuration.
 *  GET   → the current site name (admin only).
 *  PATCH → rename the site; busts the site-config cache so it propagates live.
 */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json({ name: await getSiteName() });
}

const patchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Keep it under 50 characters"),
});

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "site-config", { limit: 10, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  let parsed;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: msg ?? "Invalid name" }, { status: 400 });
  }

  const row = await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: { name: parsed.name },
    create: { id: 1, name: parsed.name },
  });

  // No revalidation needed: getSiteName() reads fresh per request (request-scoped
  // cache only), so every server surface picks up the new name immediately.

  await logAudit({
    userId: session.user.id,
    action: "SITE_CONFIG_UPDATED",
    metadata: { name: row.name },
    req,
  });

  return NextResponse.json({ name: row.name });
}

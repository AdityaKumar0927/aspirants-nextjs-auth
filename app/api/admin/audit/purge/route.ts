import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * Enforces the 1-year audit-log retention (DPDP Rule 6): deletes AuditLog rows
 * older than 365 days.
 *  - POST: admin-triggered (from the admin UI).
 *  - GET:  scheduled (Vercel Cron). Vercel attaches `Authorization: Bearer
 *    ${CRON_SECRET}` to cron requests when CRON_SECRET is set; we require it.
 */
const RETENTION_DAYS = 365;

async function purge() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return { ok: true, deleted: count, cutoff: cutoff.toISOString() };
}

export async function POST() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json(await purge());
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await purge());
}

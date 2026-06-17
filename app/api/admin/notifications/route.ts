import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"

/**
 * Admin site-wide announcements (Notification rows with userId = null, shown to
 * every signed-in user via /api/notifications).
 *
 * GET  — list existing announcements (newest first).
 * POST — create one ({ title, message }).
 */
export async function GET() {
  const { response } = await requireAdmin()
  if (response) return response

  const items = await prisma.notification.findMany({
    where: { userId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin()
  if (response) return response

  const csrf = assertSameOrigin(req); if (csrf) return csrf;
  const limited = await rateLimit(req, "notification-broadcast", { limit: 20, windowSec: 60 }, session.user.id); if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as { title?: string; message?: string }
  const title = (body.title ?? "").trim()
  const message = (body.message ?? "").trim()
  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
  }

  const created = await prisma.notification.create({
    data: {
      userId: null,
      title: title.slice(0, 200),
      message: message.slice(0, 2000),
      type: "ADMIN_ANNOUNCEMENT",
    },
  })

  await logAudit({
    userId: session.user.id,
    action: "NOTIFICATION_BROADCAST",
    metadata: { notificationId: created.id, title: created.title },
    req,
  })

  return NextResponse.json(created, { status: 201 })
}

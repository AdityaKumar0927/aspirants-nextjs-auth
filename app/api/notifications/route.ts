import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSession } from "@/lib/auth"

/**
 * GET /api/notifications — the signed-in user's notifications PLUS site-wide
 * announcements (rows with userId = null), newest first.
 *
 * PATCH /api/notifications — mark the user's OWN notifications read
 * ({ all: true } or { ids: [...] }). Site-wide announcements have no per-user
 * row, so their "read" state is tracked client-side.
 */
export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response

  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId: session.user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      read: true,
      createdAt: true,
      userId: true,
    },
  })
  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = (await req.json().catch(() => ({}))) as { ids?: string[]; all?: boolean }
  const where: { userId: string; id?: { in: string[] } } = { userId: session.user.id }
  if (Array.isArray(body.ids) && body.ids.length) where.id = { in: body.ids }

  await prisma.notification.updateMany({ where, data: { read: true } })
  return NextResponse.json({ ok: true })
}

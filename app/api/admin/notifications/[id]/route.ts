import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

/** Edit / delete a site-wide announcement (admin only; never touches per-user rows). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { title?: string; message?: string }
  const data: { title?: string; message?: string } = {}
  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 200)
  if (typeof body.message === "string") data.message = body.message.trim().slice(0, 2000)
  if (!data.title && !data.message) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  // Only site-wide announcements (userId = null) are editable here.
  const existing = await prisma.notification.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== null) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
  }

  const updated = await prisma.notification.update({ where: { id }, data })

  await logAudit({
    userId: session.user.id,
    action: "NOTIFICATION_UPDATED",
    metadata: { notificationId: id },
    req,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin()
  if (response) return response

  const { id } = await params
  await prisma.notification.deleteMany({ where: { id, userId: null } })

  await logAudit({
    userId: session.user.id,
    action: "NOTIFICATION_DELETED",
    metadata: { notificationId: id },
    req,
  })

  return NextResponse.json({ ok: true })
}

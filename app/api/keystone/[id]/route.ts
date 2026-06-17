import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/rate-limit";

/** DELETE /api/keystone/[id] — remove one of the caller's shelf items (IDOR-safe). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const { id } = await params;
  // deleteMany scoped by userId: a non-owner's delete simply matches nothing.
  await prisma.keystoneItem.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

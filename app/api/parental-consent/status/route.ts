import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/**
 * The minor's onboarding screen polls this to learn when their parent has
 * approved, so it can refresh the session and release the gate.
 */
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const record = await prisma.parentalConsent.findUnique({
    where: { userId: session.user.id },
    select: { status: true, parentEmail: true, requestedAt: true },
  });

  const res = NextResponse.json({
    status: record?.status ?? "NONE",
    parentEmail: record?.parentEmail ?? null,
  });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

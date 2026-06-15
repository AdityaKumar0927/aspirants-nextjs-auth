import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendDataRequestAck } from "@/lib/email";
import { DATA_REQUEST_SLA_DAYS } from "@/lib/constants";

/**
 * Data-principal requests (access / correction / erasure / grievance /
 * withdraw-consent). POST files a request with a 90-day SLA due date and emails
 * an acknowledgement; GET returns the caller's own requests + history.
 */
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const requests = await prisma.dataRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const res = NextResponse.json(requests);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

const postSchema = z.object({
  type: z.enum(["ACCESS", "CORRECTION", "ERASURE", "GRIEVANCE", "WITHDRAW_CONSENT"]),
  message: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  const userId = session.user.id;

  let parsed;
  try {
    parsed = postSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const dueAt = new Date(Date.now() + DATA_REQUEST_SLA_DAYS * 24 * 60 * 60 * 1000);

  const request = await prisma.dataRequest.create({
    data: {
      userId,
      type: parsed.type,
      message: parsed.message ?? null,
      dueAt,
    },
  });

  if (session.user.email) {
    await sendDataRequestAck({
      to: session.user.email,
      requestType: parsed.type,
      dueAt,
    });
  }

  await logAudit({
    userId,
    action: "DATA_REQUEST_CREATED",
    metadata: { type: parsed.type, requestId: request.id },
    req,
  });

  return NextResponse.json(request, { status: 201 });
}

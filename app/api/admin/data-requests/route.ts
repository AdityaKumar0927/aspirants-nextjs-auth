import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { DataRequestStatus } from "@prisma/client";

/**
 * Admin queue of data-principal requests. Optional ?status= filter; results
 * include the requester's name/email so staff can fulfil and reply.
 */
export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const valid: DataRequestStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"];
  const where =
    statusParam && valid.includes(statusParam as DataRequestStatus)
      ? { status: statusParam as DataRequestStatus }
      : {};

  const requests = await prisma.dataRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 500,
    include: { User: { select: { name: true, email: true } } },
  });

  const res = NextResponse.json(requests);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

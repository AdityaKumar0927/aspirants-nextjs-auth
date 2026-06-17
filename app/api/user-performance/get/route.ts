// /app/api/user-performance/get/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';
import { requireSession } from "@/lib/auth";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  try {
    const userPerformance = await prisma.userPerformance.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error('Error fetching user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit, assertSameOrigin } from '@/lib/rate-limit';

const postSchema = z.object({
  questionId: z.string().min(1),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const limited = await rateLimit(request, "mark-complete", { limit: 120, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { questionId, completed } = parsed.data;

    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: { completed },
      create: { userId: session.user.id, questionId, reviewed: false, completed },
    });

    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Error in markComplete API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

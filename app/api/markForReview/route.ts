import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { rateLimit, assertSameOrigin } from '@/lib/rate-limit';

const postSchema = z.object({
  questionId: z.string().min(1),
  reviewed: z.boolean(),
});

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const limited = await rateLimit(request, "mark-review", { limit: 120, windowSec: 60 }, session.user.id);
  if (limited) return limited;

  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { questionId, reviewed } = parsed.data;

    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
      update: { reviewed },
      create: { userId: session.user.id, questionId, reviewed, completed: false },
    });

    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Error in markForReview API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

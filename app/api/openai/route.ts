// app/api/openai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { subscriptionMiddleware } from '@/app/api/middleware/subscription';
import { rateLimitMiddleware } from '@/app/api/middleware/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  // Middleware checks
  await subscriptionMiddleware(req);
  await rateLimitMiddleware(req);

  const { question, context } = await req.json();

  if (!question || !context) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const response = await openai.completions.create({
    model: 'text-davinci-003',
    prompt: `Context: ${context}\nQuestion: ${question}`,
    max_tokens: 150,
  });

  return NextResponse.json({ response: response.choices[0].text });
}

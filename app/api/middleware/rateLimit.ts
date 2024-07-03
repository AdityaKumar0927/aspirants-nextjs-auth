// app/api/middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 1,
  duration: 60, // 1 request per minute
});

export async function rateLimitMiddleware(req: NextRequest) {
  try {
    await rateLimiter.consume(req.ip || ''); // consume 1 point per request
    return NextResponse.next();
  } catch (rejRes) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
}

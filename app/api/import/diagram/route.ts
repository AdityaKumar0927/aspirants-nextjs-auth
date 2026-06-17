import { NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/rate-limit";
import { saveImageFromDataUrl } from "@/lib/storage";

export const runtime = "nodejs";

const bodySchema = z.object({
  // ~5.6M base64 chars ≈ 4MB binary, matching the storage-layer cap
  image: z.string().min(50).max(6_000_000),
});

// Optional per-user upload throttle (active only when Upstash is configured),
// bounding how fast even an admin session can write files to disk.
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:import-diagram",
      })
    : null;

/**
 * POST /api/import/diagram  (admin only)
 *
 * Stores a diagram image cropped from a PDF page (sent as a data URL by the
 * import wizard) and returns its public URL for use as Question.diagramUrl
 * or as a Markdown image inside question text.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  if (ratelimit) {
    const { success } = await ratelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { url } = await saveImageFromDataUrl(parsed.data.image);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/import/diagram:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save image" },
      { status: 400 }
    );
  }
}

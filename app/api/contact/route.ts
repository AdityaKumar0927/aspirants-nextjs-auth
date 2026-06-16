import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email";
import { rateLimit, assertSameOrigin, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

// Public contact endpoint. Validates the message and emails support via
// lib/email (which degrades gracefully — logs to the server console when
// RESEND_API_KEY is unset, so the flow works in dev without mail infra).
const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  topic: z.string().trim().min(1).max(80),
  message: z.string().trim().min(5, "Your message is too short.").max(5000),
  // Honeypot: a hidden field real users never fill. Bots that populate it are dropped.
  company: z.string().max(200).optional(),
  // Cloudflare Turnstile token (only enforced when TURNSTILE_SECRET_KEY is set).
  turnstileToken: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  // Public endpoint — guard against bots/spam and cross-origin abuse.
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const limited = await rateLimit(req, "contact", { limit: 4, windowSec: 600 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 400 }
    );
  }

  // Honeypot tripped → silently accept (don't tip off the bot) but send nothing.
  if (parsed.data.company && parsed.data.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  // CAPTCHA (gated): only enforced when Turnstile is configured.
  const human = await verifyTurnstile(parsed.data.turnstileToken, clientIp(req));
  if (!human) {
    return NextResponse.json(
      { error: "Could not verify you're human. Please try again." },
      { status: 400 }
    );
  }

  const { name, email, topic, message } = parsed.data;
  await sendContactMessage({ name, email, topic, message });
  return NextResponse.json({ ok: true });
}

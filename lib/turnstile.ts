/**
 * Cloudflare Turnstile — a free, privacy-friendly CAPTCHA — server-side check.
 *
 * GATED: if TURNSTILE_SECRET_KEY is unset the check is skipped (returns true),
 * so the site works with zero setup. Add the free key (+ NEXT_PUBLIC_TURNSTILE_
 * SITE_KEY for the widget) to activate bot verification on public forms.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip
  if (!token) return false; // configured but the client sent no token → reject

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Couldn't reach Cloudflare — don't hard-block legitimate users on a
    // transient outage; the honeypot, rate limit and same-origin checks remain.
    return true;
  }
}

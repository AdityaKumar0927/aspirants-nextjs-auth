import { GRIEVANCE_OFFICER_EMAIL } from "@/lib/constants";

/**
 * Minimal transactional email for compliance flows (parental-consent links and
 * data-request acknowledgements).
 *
 * Uses the Resend REST API directly via fetch — no SDK dependency. When
 * RESEND_API_KEY is unset (local dev / preview), it DEGRADES GRACEFULLY: the
 * message is logged to the server console instead of being sent, so the flow is
 * still testable end-to-end without mail infra (mirrors the optional-Upstash
 * pattern used elsewhere). Sending never throws into the caller.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

function fromAddress(): string {
  // e.g. "Aspirants <no-reply@aspirants.tech>"
  return process.env.EMAIL_FROM ?? `Aspirants <${GRIEVANCE_OFFICER_EMAIL}>`;
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set — not sending. To: ${opts.to}\n` +
        `Subject: ${opts.subject}\n${opts.text}`
    );
    return { sent: false };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}):`, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] send error:", error);
    return { sent: false };
  }
}

export async function sendParentalConsentEmail(params: {
  parentEmail: string;
  childName: string;
  verifyUrl: string;
}): Promise<{ sent: boolean }> {
  const { parentEmail, childName, verifyUrl } = params;
  const subject = "Approve your child's Aspirants account";
  const text =
    `${childName} has asked to use Aspirants, an exam-preparation platform.\n\n` +
    `Because they are under 18, Indian data-protection law (DPDP Act 2023) requires a parent or guardian to approve before we process their personal data.\n\n` +
    `We collect their name, email and study activity to provide the service. We do NOT track, profile, or show targeted advertising to children.\n\n` +
    `Approve here (link expires in 7 days):\n${verifyUrl}\n\n` +
    `If you did not expect this, you can ignore this email and no account will be activated.\n\n` +
    `Questions: ${GRIEVANCE_OFFICER_EMAIL}`;
  const html = `
    <p><strong>${escapeHtml(childName)}</strong> has asked to use Aspirants, an exam-preparation platform.</p>
    <p>Because they are under 18, Indian data-protection law (DPDP Act 2023) requires a parent or guardian to approve before we process their personal data.</p>
    <p>We collect their name, email and study activity to provide the service. We do <strong>not</strong> track, profile, or show targeted advertising to children.</p>
    <p><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;padding:10px 18px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">Review &amp; approve</a></p>
    <p style="color:#6b7280;font-size:13px">This link expires in 7 days. If you did not expect this, you can ignore this email and no account will be activated.</p>
    <p style="color:#6b7280;font-size:13px">Questions: ${escapeHtml(GRIEVANCE_OFFICER_EMAIL)}</p>`;
  return sendEmail({ to: parentEmail, subject, html, text });
}

export async function sendDataRequestAck(params: {
  to: string;
  requestType: string;
  dueAt: Date;
}): Promise<{ sent: boolean }> {
  const { to, requestType, dueAt } = params;
  const due = dueAt.toISOString().slice(0, 10);
  const subject = "We've received your data request";
  const text =
    `We've received your ${requestType.toLowerCase().replace(/_/g, " ")} request.\n\n` +
    `Under the DPDP Rules 2025 we will respond by ${due}.\n\n` +
    `Grievance Officer: ${GRIEVANCE_OFFICER_EMAIL}`;
  const html = `
    <p>We've received your <strong>${escapeHtml(
      requestType.toLowerCase().replace(/_/g, " ")
    )}</strong> request.</p>
    <p>Under the DPDP Rules 2025 we will respond by <strong>${escapeHtml(due)}</strong>.</p>
    <p style="color:#6b7280;font-size:13px">Grievance Officer: ${escapeHtml(
      GRIEVANCE_OFFICER_EMAIL
    )}</p>`;
  return sendEmail({ to, subject, html, text });
}

export async function sendContactMessage(params: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<{ sent: boolean }> {
  const { name, email, topic, message } = params;
  const subject = `[Contact · ${topic}] from ${name || "an aspirant"}`;
  const text =
    `New contact message via aspirants.tech\n\n` +
    `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`;
  const html = `
    <p style="margin:0 0 8px"><strong>New contact message</strong> via aspirants.tech</p>
    <p style="margin:0"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin:0 0 10px"><strong>Topic:</strong> ${escapeHtml(topic)}</p>
    <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>`;
  // Reply-to the sender so support can respond directly from their inbox.
  return sendEmail({ to: GRIEVANCE_OFFICER_EMAIL, subject, html, text, replyTo: email });
}

/** Local escape (lib/sanitize escapeHtml is browser/node DOMPurify-backed; keep email dep-free). */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

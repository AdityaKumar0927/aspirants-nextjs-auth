export const DEPLOY_URL = `https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fprecedent&project-name=precedent&repository-name=precedent&demo-title=Precedent&demo-description=An%20opinionated%20collection%20of%20components%2C%20hooks%2C%20and%20utilities%20for%20your%20Next%20project.&demo-url=https%3A%2F%2Fprecedent.dev&demo-image=https%3A%2F%2Fprecedent.dev%2Fopengraph-image&env=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET&envDescription=How%20to%20get%20these%20env%20variables%3A&envLink=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fprecedent%2Fblob%2Fmain%2F.env.example&stores=%5B%7B"type"%3A"postgres"%7D%5D`;

// ===========================================================================
// DPDP (India) compliance constants
// ===========================================================================

/**
 * Designated Grievance Officer / Data Protection contact, published in the
 * privacy policy, consent notice, grievance page and outbound emails
 * (DPDP Act s.13 / Rules 2025 — a named contact must be prominently displayed).
 * Override via env in production.
 */
export const GRIEVANCE_OFFICER_NAME =
  process.env.GRIEVANCE_OFFICER_NAME ?? "Grievance Officer";
export const GRIEVANCE_OFFICER_EMAIL =
  process.env.GRIEVANCE_OFFICER_EMAIL ?? "aspirants.contact@gmail.com";

/**
 * Version stamp of the consent notice currently in force. Bump this whenever
 * the notice text or the set of processing purposes changes — every
 * ConsentRecord stores the version it was granted under, so a notice change can
 * trigger re-consent.
 */
export const CONSENT_VERSION = "notice-2026-06-12";

/** Days a Data Fiduciary has to respond to a data-principal request (Rules 2025). */
export const DATA_REQUEST_SLA_DAYS = 90;

/**
 * Plain-language retention schedule, surfaced in the privacy policy and consent
 * notice (Rule 8 — purpose-specific retention must be disclosed). These describe
 * the policy; on-request erasure is handled by /api/user/delete.
 */
export const DATA_RETENTION: { category: string; period: string }[] = [
  {
    category: "Account & profile (name, email, date of birth)",
    period: "Until you delete your account, or 3 years after your last sign-in.",
  },
  {
    category: "Study activity (answers, progress, performance, notes)",
    period: "Until account deletion; erased with the account.",
  },
  {
    category: "Consent & parental-consent records",
    period: "Life of the account; consent history retained for audit.",
  },
  {
    category: "Security & audit logs",
    period: "1 year, then automatically purged.",
  },
  {
    category: "AI usage logs (PDF import / hints)",
    period: "Until account deletion.",
  },
];

/** Minimum age (years) below which verifiable parental consent is required. */
export const MINOR_AGE_THRESHOLD = 18;

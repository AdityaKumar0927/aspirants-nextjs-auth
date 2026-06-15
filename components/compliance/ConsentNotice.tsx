import {
  GRIEVANCE_OFFICER_EMAIL,
  GRIEVANCE_OFFICER_NAME,
  DATA_RETENTION,
} from "@/lib/constants";

/**
 * The standalone, plain-language consent notice required by DPDP Rule 3 —
 * itemizes the personal data collected, the purpose of each processing
 * activity, how long it is kept, and how to exercise rights / withdraw consent.
 *
 * Presentational and prop-driven so the SAME text is the single source of truth
 * for both the /consent-notice page and the onboarding step. Pass the resolved
 * grievance contact from a server component so the env override is honoured
 * (server-only env vars are not available when this renders inside a client
 * subtree).
 */
export interface ConsentNoticeProps {
  grievanceName?: string;
  grievanceEmail?: string;
  compact?: boolean;
}

const PROCESSING: { data: string; purpose: string }[] = [
  { data: "Name & email (from Google sign-in)", purpose: "Create and secure your account; send service notices." },
  { data: "Date of birth", purpose: "Confirm you are old enough to consent, or trigger parental consent if under 18." },
  { data: "Study activity (answers, progress, performance, notes, mock exams)", purpose: "Provide the question bank, track your progress and show your analytics." },
  { data: "Uploaded PDFs & AI prompts (import / hints)", purpose: "Run the optional AI extraction and hint features you invoke." },
  { data: "Device / usage analytics (only with your consent)", purpose: "Understand and improve how the product is used. Never collected for under-18 users." },
];

export default function ConsentNotice({
  grievanceName = GRIEVANCE_OFFICER_NAME,
  grievanceEmail = GRIEVANCE_OFFICER_EMAIL,
  compact = false,
}: ConsentNoticeProps) {
  return (
    <div className="latex-font max-w-none space-y-3 text-sm leading-relaxed text-ink">
      <p>
        Penwise (the &ldquo;Data Fiduciary&rdquo;) processes your personal data
        under India&rsquo;s Digital Personal Data Protection Act, 2023. Please
        read this notice before you consent.
      </p>

      <h4 className="type-data mt-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
        What we collect and why
      </h4>
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="type-data py-1 pr-4 text-[11px] font-normal uppercase tracking-[0.14em] text-pencil">
              Personal data
            </th>
            <th className="type-data py-1 text-[11px] font-normal uppercase tracking-[0.14em] text-pencil">
              Purpose
            </th>
          </tr>
        </thead>
        <tbody>
          {PROCESSING.map((row) => (
            <tr key={row.data} className="border-t border-rule">
              <td className="py-1 pr-4 align-top">{row.data}</td>
              <td className="py-1 align-top">{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {!compact && (
        <>
          <h4 className="type-data mt-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
            How long we keep it
          </h4>
          <ul className="list-disc space-y-1 pl-5">
            {DATA_RETENTION.map((r) => (
              <li key={r.category}>
                <strong>{r.category}:</strong> {r.period}
              </li>
            ))}
          </ul>
        </>
      )}

      <h4 className="type-data mt-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
        Your rights
      </h4>
      <p>
        You can access and download your data, correct it, withdraw any
        non-essential consent, request erasure, or raise a grievance at any time
        from <strong>Settings → Privacy &amp; Data</strong>. Withdrawing consent
        is as easy as giving it and does not affect processing already carried
        out. We respond to requests within 90 days.
      </p>

      <h4 className="type-data mt-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
        Children
      </h4>
      <p>
        If you are under 18 we require verifiable consent from a parent or
        guardian, and we never track, profile, or show targeted advertising to
        you.
      </p>

      <h4 className="type-data mt-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
        Contact
      </h4>
      <p>
        Grievance / Data Protection Officer: <strong>{grievanceName}</strong> —{" "}
        <a href={`mailto:${grievanceEmail}`} className="break-all text-ballpoint underline">
          {grievanceEmail}
        </a>
        . You may also complain to the Data Protection Board of India.
      </p>
    </div>
  );
}

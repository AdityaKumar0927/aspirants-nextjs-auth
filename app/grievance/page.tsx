import { GRIEVANCE_OFFICER_EMAIL, GRIEVANCE_OFFICER_NAME } from "@/lib/constants";

/**
 * Public grievance / Data Protection Officer page (DPDP requires the contact to
 * be prominently published). Signed-in users can file a tracked request from
 * Settings → Privacy & Data; everyone can reach the officer by email.
 */
export default function GrievancePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          Your data rights
        </p>
        <h1 className="type-display mt-1 text-2xl sm:text-3xl">
          <span className="highlight-sweep">Grievance</span> &amp; data protection
        </h1>
        <p className="mt-2 text-sm text-pencil">
          We take your data-protection rights seriously. If you have a question,
          request, or complaint about how we handle your personal data, you can
          reach our Grievance / Data Protection Officer below.
        </p>
      </div>

      <div className="paper-sheet p-6">
        <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          Grievance / Data Protection Officer
        </h2>
        <p className="mt-2 text-sm">
          <strong>{GRIEVANCE_OFFICER_NAME}</strong>
        </p>
        <p className="mt-1 text-sm">
          <a href={`mailto:${GRIEVANCE_OFFICER_EMAIL}`} className="type-data break-all text-ballpoint underline">
            {GRIEVANCE_OFFICER_EMAIL}
          </a>
        </p>
        <p className="counterfoil mt-4 pt-4 text-sm text-pencil">
          We respond to all data-principal requests within 90 days. If you are
          signed in, you can file and track a formal access, correction, erasure
          or grievance request from{" "}
          <a href="/forms/privacy" className="text-ballpoint underline">
            Settings → Privacy &amp; Data
          </a>
          . You may also complain to the Data Protection Board of India.
        </p>
      </div>
    </div>
  );
}

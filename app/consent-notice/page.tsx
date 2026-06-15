import { GRIEVANCE_OFFICER_EMAIL, GRIEVANCE_OFFICER_NAME } from "@/lib/constants";
import ConsentNotice from "@/components/compliance/ConsentNotice";

/** Standalone, plain-language consent notice (DPDP Rule 3). */
export default function ConsentNoticePage() {
  return (
    <div>
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        DPDP Act, 2023 — Rule 3
      </p>
      <h1 className="type-display mb-6 mt-1 text-3xl">
        <span className="highlight-sweep">Consent</span> notice
      </h1>
      <div className="paper-sheet p-6">
        <ConsentNotice
          grievanceName={GRIEVANCE_OFFICER_NAME}
          grievanceEmail={GRIEVANCE_OFFICER_EMAIL}
        />
      </div>
    </div>
  );
}

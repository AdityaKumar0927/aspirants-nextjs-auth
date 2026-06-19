import { GRIEVANCE_OFFICER_EMAIL, GRIEVANCE_OFFICER_NAME } from "@/lib/constants";
import { getSiteName } from "@/lib/site-config";
import ConsentNotice from "@/components/compliance/ConsentNotice";
import VerifyConfirm from "./verify-confirm";

/**
 * Public parental-consent landing page. The parent reviews what is collected
 * and clicks Confirm (an explicit affirmative action) to approve — the click
 * POSTs the token to /api/parental-consent/verify.
 */
export default async function ParentalConsentVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const name = await getSiteName();

  return (
    <div className="paper-sheet w-full max-w-2xl p-8">
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        Parental approval
      </p>
      <h1 className="type-display mt-1 text-2xl">Approve your child&rsquo;s account</h1>
      <p className="mt-2 text-sm text-pencil">
        Your child has asked to use {name}, an exam-preparation platform.
        Indian data-protection law requires your approval before we process their
        personal data. Please review the notice below.
      </p>

      <div className="mt-6 max-h-72 overflow-y-auto rounded-md border border-rule p-4">
        <ConsentNotice
          grievanceName={GRIEVANCE_OFFICER_NAME}
          grievanceEmail={GRIEVANCE_OFFICER_EMAIL}
        />
      </div>

      <VerifyConfirm token={token ?? null} />
    </div>
  );
}

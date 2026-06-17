import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { GRIEVANCE_OFFICER_EMAIL, GRIEVANCE_OFFICER_NAME } from "@/lib/constants";
import PrivacyDashboard from "./privacy-dashboard";

/**
 * Privacy & Data settings — the data-principal self-service hub: download your
 * data, manage/withdraw consents, see consent history, and file
 * correction/erasure/grievance requests.
 */
export default async function PrivacySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium">Privacy &amp; Data</h3>
        <p className="text-sm text-muted-foreground">
          Exercise your rights under India&rsquo;s Digital Personal Data
          Protection Act — access, correct, or erase your data and manage your
          consents.
        </p>
      </div>
      <Separator />
      <PrivacyDashboard
        isMinor={session.user.isMinor === true}
        grievanceName={GRIEVANCE_OFFICER_NAME}
        grievanceEmail={GRIEVANCE_OFFICER_EMAIL}
      />
    </div>
  );
}

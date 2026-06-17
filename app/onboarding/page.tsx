import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { GRIEVANCE_OFFICER_EMAIL, GRIEVANCE_OFFICER_NAME } from "@/lib/constants";
import OnboardingFlow from "./onboarding-flow";

/**
 * Onboarding gate page. Reached via the middleware redirect for any signed-in
 * user who hasn't finished onboarding (or a minor awaiting parental consent).
 * Fully-onboarded users are bounced home; signed-out users to sign-in.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { ParentalConsent: true },
  });

  const isMinor = user?.isMinor === true;
  const parentalConsentOk = isMinor
    ? user?.ParentalConsent?.status === "VERIFIED"
    : true;

  if (user?.onboardingComplete && parentalConsentOk) {
    redirect("/");
  }

  return (
    <OnboardingFlow
      name={session.user.name ?? null}
      email={session.user.email ?? null}
      initialAwaitingParental={!!user?.onboardingComplete && isMinor && !parentalConsentOk}
      initialParentEmail={user?.ParentalConsent?.parentEmail ?? null}
      grievanceName={GRIEVANCE_OFFICER_NAME}
      grievanceEmail={GRIEVANCE_OFFICER_EMAIL}
    />
  );
}

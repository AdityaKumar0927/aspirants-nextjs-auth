"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import ConsentNotice from "@/components/compliance/ConsentNotice";

const MINOR_AGE = 18;

function ageFrom(dateStr: string): number | null {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

interface Props {
  name: string | null;
  email: string | null;
  initialAwaitingParental: boolean;
  initialParentEmail: string | null;
  grievanceName: string;
  grievanceEmail: string;
}

type Phase = "details" | "awaitingParental";

export default function OnboardingFlow({
  name,
  email,
  initialAwaitingParental,
  initialParentEmail,
  grievanceName,
  grievanceEmail,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const [phase, setPhase] = useState<Phase>(
    initialAwaitingParental ? "awaitingParental" : "details"
  );
  const [dob, setDob] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [parentEmail, setParentEmail] = useState(initialParentEmail ?? "");
  const [parentName, setParentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const age = ageFrom(dob);
  const isMinor = age !== null && age < MINOR_AGE;
  const canSubmit =
    !!dob &&
    age !== null &&
    age >= 0 &&
    acceptTerms &&
    acceptPrivacy &&
    (!isMinor || /.+@.+\..+/.test(parentEmail));

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: dob,
          acceptTerms,
          acceptPrivacy,
          consents: { analytics, marketing },
          parentEmail: isMinor ? parentEmail : undefined,
          parentName: isMinor ? parentName || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.awaitingParentalConsent) {
        setPhase("awaitingParental");
      } else {
        await update();
        router.replace("/");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // While awaiting parental consent, poll status and release the gate on VERIFIED.
  useEffect(() => {
    if (phase !== "awaitingParental") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/parental-consent/status");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.status === "VERIFIED") {
          await update();
          router.replace("/");
          router.refresh();
        }
      } catch {
        /* ignore transient errors */
      }
    };
    const id = setInterval(poll, 5000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, router, update]);

  async function resendParentEmail() {
    setError(null);
    setDevLink(null);
    try {
      const res = await fetch("/api/parental-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail, parentName: parentName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resend the email.");
        return;
      }
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (phase === "awaitingParental") {
    return (
      <div className="paper-sheet w-full max-w-md p-8 text-center">
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          Awaiting parental approval
        </p>
        <h1 className="type-display mt-1 text-xl">Almost there</h1>
        <p className="mt-3 text-sm text-pencil">
          Because you&rsquo;re under 18, we&rsquo;ve emailed{" "}
          <strong className="text-ink">{parentEmail || initialParentEmail}</strong> to approve your
          account. This page will continue automatically once they confirm.
        </p>
        <div className="mt-6 flex justify-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rule border-t-ink" />
        </div>
        <button
          onClick={resendParentEmail}
          className="mt-4 inline-flex min-h-11 items-center text-xs font-medium text-ballpoint underline"
        >
          Resend approval email
        </button>
        {devLink && (
          <p className="mt-4 break-all rounded-md bg-secondary p-3 text-left text-xs">
            Dev link (no mail provider configured):{" "}
            <a href={devLink} className="text-ballpoint underline">
              {devLink}
            </a>
          </p>
        )}
        {error && <p className="mt-4 text-xs text-redpen">{error}</p>}
      </div>
    );
  }

  return (
    <div className="paper-sheet w-full max-w-2xl p-8">
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        Before you begin
      </p>
      <h1 className="type-display mt-1 text-2xl">Welcome{name ? `, ${name}` : ""}</h1>
      <p className="mt-2 text-sm text-pencil">
        Before you start, a few details and your consent — required under
        India&rsquo;s Digital Personal Data Protection Act.
      </p>

      {/* Step 1 — Date of birth */}
      <div className="mt-6">
        <label htmlFor="onboarding-dob" className="block text-sm font-medium">
          Date of birth
        </label>
        <input
          id="onboarding-dob"
          type="date"
          value={dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDob(e.target.value)}
          className="type-data mt-1 min-h-11 w-56 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink"
        />
        {isMinor && (
          <p className="mt-2 text-xs text-pencil">
            You&rsquo;re under 18, so a parent or guardian must approve your
            account. We won&rsquo;t use analytics or profiling for you.
          </p>
        )}
      </div>

      {/* Step 2 — Consent notice */}
      <div className="mt-6 max-h-72 overflow-y-auto rounded-md border border-rule p-4">
        <ConsentNotice grievanceName={grievanceName} grievanceEmail={grievanceEmail} />
      </div>

      {/* Step 3 — Affirmative consent (no pre-ticked boxes) */}
      <div className="mt-6 space-y-3">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-(--ballpoint)"
          />
          <span>
            I accept the{" "}
            <a href="/terms-of-service" target="_blank" className="text-ballpoint underline">
              Terms of Service
            </a>
            . <span className="text-redpen">*</span>
          </span>
        </label>
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-(--ballpoint)"
          />
          <span>
            I have read the consent notice and accept the{" "}
            <a href="/privacy-policy" target="_blank" className="text-ballpoint underline">
              Privacy Policy
            </a>{" "}
            for the essential processing described above.{" "}
            <span className="text-redpen">*</span>
          </span>
        </label>

        {!isMinor && (
          <>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-(--ballpoint)"
              />
              <span>
                (Optional) Allow usage analytics to help improve the product.
              </span>
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-(--ballpoint)"
              />
              <span>(Optional) Send me product updates and announcements.</span>
            </label>
          </>
        )}
      </div>

      {/* Parent details for minors */}
      {isMinor && (
        <div className="paper-sheet border-rule mt-6 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-st-review" aria-hidden="true" />
            Parent / guardian approval
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="email"
              placeholder="Parent/guardian email *"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="min-h-11 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil"
            />
            <input
              type="text"
              placeholder="Parent/guardian name (optional)"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="min-h-11 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-redpen">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="mt-6 min-h-11 w-full"
      >
        {submitting ? "Saving" : isMinor ? "Continue & request parental approval" : "Continue"}
      </Button>
    </div>
  );
}

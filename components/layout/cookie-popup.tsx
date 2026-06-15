"use client";

import { useEffect, useRef, useState } from "react";
import { useConsent } from "@/components/compliance/ConsentProvider";
import CookiePolicyContent from "@/components/legal/CookiePolicyContent";

/**
 * Cookie consent modal. Centered, with the full cookie policy in a scrollable
 * window and the choices fixed below it — so the policy is readable in place
 * (no navigating away). Visibility and persistence are driven by the shared
 * ConsentProvider (first-party cookie + server mirror), so a choice here
 * actually gates analytics via <AnalyticsGate/>; essential cookies are always
 * on, non-essential are OFF until the user opts in (no pre-ticked boxes).
 */
const CookiePopup = () => {
  const { analytics, marketing, bannerOpen, updateConsent, closeBanner } =
    useConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  const dialogRef = useRef<HTMLDivElement>(null);

  // While the modal is open: lock background scroll, move focus into the dialog,
  // and close on Escape (mirrors AnimatedModal's behaviour for a true overlay).
  useEffect(() => {
    if (!bannerOpen) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBanner();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [bannerOpen, closeBanner]);

  if (!bannerOpen) return null;

  // Seed the preferences draft from current consent when opening the panel
  // (in the event handler, not an effect).
  const openPreferences = () => {
    setDraft({ analytics, marketing });
    setShowPreferences(true);
  };

  const acceptAll = () => updateConsent({ analytics: true, marketing: true });
  const rejectAll = () => updateConsent({ analytics: false, marketing: false });
  const savePreferences = () => {
    updateConsent({ analytics: draft.analytics, marketing: draft.marketing });
    setShowPreferences(false);
  };

  const outlineBtn =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-rule px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-secondary focus:outline-none sm:min-h-0";
  const primaryBtn =
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-ink/90 focus:outline-none sm:min-h-0";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-md" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie consent"
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_20px_60px_rgba(15,18,35,0.25)] focus:outline-none"
      >
        {/* Header */}
        <div className="border-b border-rule px-5 py-4 sm:px-6">
          <h2 className="type-display text-xl text-ink">🍪 We use cookies</h2>
          <p className="mt-1 text-sm text-pencil">
            Essential cookies keep the site running. Analytics cookies stay off
            until you allow them — and never for users under 18. Review the policy
            below, then choose.
          </p>
        </div>

        {/* Scrollable body: policy, or the preferences panel */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {showPreferences ? (
            <div className="space-y-4">
              <div>
                <h3 className="type-display text-base text-ink">Cookie preferences</h3>
                <p className="mt-1 text-sm text-pencil">
                  Choose which cookies you allow. You can change this anytime from
                  Settings → Privacy &amp; Data.
                </p>
              </div>
              <div className="divide-y divide-rule rounded-lg border border-rule">
                <PreferenceRow
                  label="Essential cookies"
                  hint="Required for the site to work."
                  checked
                  disabled
                />
                <PreferenceRow
                  label="Analytics cookies"
                  hint="Help us understand usage to improve the site."
                  checked={draft.analytics}
                  onChange={() => setDraft((d) => ({ ...d, analytics: !d.analytics }))}
                />
                <PreferenceRow
                  label="Marketing cookies"
                  hint="Currently unused; reserved for future relevant updates."
                  checked={draft.marketing}
                  onChange={() => setDraft((d) => ({ ...d, marketing: !d.marketing }))}
                />
              </div>
            </div>
          ) : (
            <CookiePolicyContent />
          )}
        </div>

        {/* Footer: choices, fixed below the scroll area */}
        <div className="border-t border-rule px-5 py-4 sm:px-6">
          {showPreferences ? (
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPreferences(false)} className={outlineBtn}>
                Cancel
              </button>
              <button onClick={savePreferences} className={primaryBtn}>
                Save preferences
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button onClick={acceptAll} className={primaryBtn}>
                Accept all
              </button>
              <button onClick={rejectAll} className={outlineBtn}>
                Reject non-essential
              </button>
              <button onClick={openPreferences} className={outlineBtn}>
                Preferences
              </button>
              <button onClick={closeBanner} className={outlineBtn}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function PreferenceRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-pencil">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-(--ballpoint) disabled:opacity-60"
      />
    </label>
  );
}

export default CookiePopup;

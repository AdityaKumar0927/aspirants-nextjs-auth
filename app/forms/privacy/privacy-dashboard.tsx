"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import T from "@/components/i18n/T"

interface Props {
  isMinor: boolean;
  grievanceName: string;
  grievanceEmail: string;
}

interface ConsentResponse {
  current: Record<string, boolean>;
  history: {
    id: string;
    purpose: string;
    granted: boolean;
    source: string;
    consentVersion: string;
    createdAt: string;
  }[];
}

interface DataRequest {
  id: string;
  type: string;
  status: string;
  message: string | null;
  response: string | null;
  dueAt: string;
  createdAt: string;
  resolvedAt: string | null;
}

const REQUEST_TYPES = [
  { value: "ACCESS", label: "Access a summary of my data" },
  { value: "CORRECTION", label: "Correct my data" },
  { value: "ERASURE", label: "Erase my data" },
  { value: "GRIEVANCE", label: "Raise a grievance" },
] as const;

function writeConsentCookie(analytics: boolean, marketing: boolean) {
  const value = encodeURIComponent(JSON.stringify({ analytics, marketing }));
  document.cookie = `dpdp-consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export default function PrivacyDashboard({
  isMinor,
  grievanceName,
  grievanceEmail,
}: Props) {
  const [consent, setConsent] = useState<ConsentResponse | null>(null);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [savingConsent, setSavingConsent] = useState(false);
  const [requestType, setRequestType] = useState<string>("ACCESS");
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadConsent = useCallback(async () => {
    const res = await fetch("/api/consent");
    if (res.ok) setConsent(await res.json());
  }, []);
  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/data-requests");
    if (res.ok) setRequests(await res.json());
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount fetch; state is
       set inside the loaders after their awaits, not synchronously. */
    loadConsent();
    loadRequests();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadConsent, loadRequests]);

  const analytics = consent?.current.ANALYTICS ?? false;
  const marketing = consent?.current.MARKETING ?? false;

  async function setCookieConsent(next: { analytics: boolean; marketing: boolean }) {
    setSavingConsent(true);
    try {
      writeConsentCookie(next.analytics, next.marketing);
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      await loadConsent();
      setToast("Consent preferences saved.");
    } finally {
      setSavingConsent(false);
    }
  }

  function downloadData() {
    // GET endpoint streams a JSON attachment.
    window.location.href = "/api/user/export";
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/data-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: requestType, message: requestMessage || undefined }),
      });
      if (res.ok) {
        setRequestMessage("");
        await loadRequests();
        setToast("Request submitted. We'll respond within 90 days.");
      } else {
        const data = await res.json();
        setToast(data.error ?? "Could not submit request.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="space-y-10">
      {toast && (
        <div role="status" className="paper-sheet px-4 py-3 text-sm text-ink">
          {toast}
        </div>
      )}

      {/* Access / portability */}
      <section>
        <h4 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.privacyPrivacyDashboard.downloadYourData" />
        </h4>
        <p className="mt-1 text-sm text-pencil">
          <T k="auto.privacyPrivacyDashboard.getAMachineReadableCopy" />
        </p>
        <Button onClick={downloadData} className="mt-3 min-h-11">
          <T k="auto.privacyPrivacyDashboard.downloadMyDataJson" />
        </Button>
      </section>

      {/* Consents */}
      <section>
        <h4 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.privacyPrivacyDashboard.yourConsents" />
        </h4>
        {isMinor ? (
          <p className="mt-1 text-sm text-pencil">
            <T k="auto.privacyPrivacyDashboard.asAUserUnder18" />
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-pencil">
              <T k="auto.privacyPrivacyDashboard.turnTheseOffAnyTime" />
            </p>
            <div className="mt-2">
              <label className="ledger-row min-h-11 justify-between text-sm text-ink">
                <span><T k="auto.privacyPrivacyDashboard.analyticsCookies" /></span>
                <input
                  type="checkbox"
                  checked={analytics}
                  disabled={savingConsent}
                  onChange={(e) =>
                    setCookieConsent({ analytics: e.target.checked, marketing })
                  }
                  className="h-4 w-4 accent-(--ballpoint)"
                />
              </label>
              <label className="ledger-row min-h-11 justify-between text-sm text-ink">
                <span><T k="auto.privacyPrivacyDashboard.marketingProductUpdates" /></span>
                <input
                  type="checkbox"
                  checked={marketing}
                  disabled={savingConsent}
                  onChange={(e) =>
                    setCookieConsent({ analytics, marketing: e.target.checked })
                  }
                  className="h-4 w-4 accent-(--ballpoint)"
                />
              </label>
            </div>
          </>
        )}
      </section>

      {/* Data requests */}
      <section>
        <h4 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.privacyPrivacyDashboard.makeARequest" />
        </h4>
        <p className="mt-1 text-sm text-pencil">
          <T k="auto.privacyPrivacyDashboard.askUsToAccessCorrect" />
        </p>
        <form onSubmit={submitRequest} className="mt-3 space-y-3">
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink"
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Add any details (optional)"
            rows={3}
            className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil"
          />
          <Button type="submit" disabled={submitting} className="min-h-11">
            {submitting ? "Submitting request" : "Submit request"}
          </Button>
        </form>

        {requests.length > 0 && (
          <div className="mt-5">
            <h5 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
              <T k="auto.privacyPrivacyDashboard.yourRequests" />
            </h5>
            <ul className="mt-1 text-sm">
              {requests.map((r) => (
                <li key={r.id} className="ledger-row justify-between">
                  <span className="text-ink">
                    {r.type.replace(/_/g, " ")}{" "}
                    <span className="type-data text-xs text-pencil">
                      <T k="auto.privacyPrivacyDashboard.due" /> {new Date(r.dueAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="type-data text-xs uppercase tracking-[0.08em] text-pencil">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Consent history */}
      {consent && consent.history.length > 0 && (
        <section>
          <h4 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
            <T k="auto.privacyPrivacyDashboard.consentHistory" />
          </h4>
          <ul className="mt-1 text-sm">
            {consent.history.slice(0, 20).map((h) => (
              <li key={h.id} className="ledger-row justify-between">
                <span className="text-ink">
                  {h.purpose} —{" "}
                  <span className={h.granted ? "text-st-answered" : "text-redpen"}>
                    {h.granted ? "granted" : "withdrawn"}
                  </span>{" "}
                  <span className="text-pencil">({h.source})</span>
                </span>
                <span className="type-data text-xs text-pencil">
                  {new Date(h.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contact */}
      <section className="paper-sheet p-4 text-sm">
        <h4 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.privacyPrivacyDashboard.grievanceDataProtectionOfficer" />
        </h4>
        <p className="mt-1 text-pencil">
          {grievanceName} —{" "}
          <a href={`mailto:${grievanceEmail}`} className="text-ballpoint underline">
            {grievanceEmail}
          </a>
        </p>
      </section>
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LANG_COOKIE, LANGUAGE_CHOSEN_EVENT } from "@/lib/i18n/languages";

/**
 * Client consent state for cookies/analytics.
 *
 * Source of truth is the first-party `dpdp-consent` cookie (so it survives
 * across sessions and is readable by the AnalyticsGate before any tracker
 * loads). For signed-in users the choice is also mirrored server-side via
 * /api/cookie-consent (passed back as `initialConsent` to avoid a flash).
 *
 * No analytics/marketing is ever on by default — the banner shows until the
 * visitor makes an explicit choice (DPDP: clear affirmative action, no
 * pre-ticked consent).
 */
export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentContextValue extends ConsentState {
  ready: boolean;
  hasChoice: boolean;
  bannerOpen: boolean;
  updateConsent: (next: ConsentState) => Promise<void>;
  openBanner: () => void;
  closeBanner: () => void;
}

const COOKIE_NAME = "dpdp-consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within a ConsentProvider");
  return ctx;
}

function readCookie(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    return {
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

function writeCookie(value: ConsentState) {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

/** True once the visitor has a language cookie (i.e. the first-visit language
 *  chooser is no longer pending). */
function hasLangCookie(): boolean {
  if (typeof document === "undefined") return false;
  return new RegExp(`(?:^|; )${LANG_COOKIE}=`).test(document.cookie);
}

export default function ConsentProvider({
  children,
  initialConsent,
}: {
  children: React.ReactNode;
  initialConsent?: ConsentState | null;
}) {
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
  });
  const [hasChoice, setHasChoice] = useState(false);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync of consent
       state from the first-party cookie on mount. This must run post-hydration
       (the cookie is unavailable during SSR), so a lazy useState initializer
       would cause a server/client hydration mismatch. */
    let cleanup: (() => void) | undefined;
    const cookie = readCookie();
    if (cookie) {
      setConsent(cookie);
      setHasChoice(true);
    } else if (initialConsent) {
      setConsent(initialConsent);
      // A server-mirrored value means the user chose before; reflect it in the
      // cookie so the gate can read it client-side, and don't reopen the banner.
      writeCookie(initialConsent);
      setHasChoice(true);
    } else if (hasLangCookie()) {
      // No consent yet, but the language step is already done — show the banner.
      setBannerOpen(true);
    } else {
      // First visit: the language chooser is still up. Wait for it to be
      // dismissed before showing the cookie banner, so they appear one by one.
      const open = () => setBannerOpen(true);
      window.addEventListener(LANGUAGE_CHOSEN_EVENT, open, { once: true });
      cleanup = () => window.removeEventListener(LANGUAGE_CHOSEN_EVENT, open);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    return cleanup;
    // initialConsent is a stable server prop; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConsent = useCallback(async (next: ConsentState) => {
    setConsent(next);
    setHasChoice(true);
    setBannerOpen(false);
    writeCookie(next);
    try {
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {
      /* logged-out or offline: cookie is still authoritative client-side */
    }
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ...consent,
      ready,
      hasChoice,
      bannerOpen,
      updateConsent,
      openBanner: () => setBannerOpen(true),
      closeBanner: () => setBannerOpen(false),
    }),
    [consent, ready, hasChoice, bannerOpen, updateConsent]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

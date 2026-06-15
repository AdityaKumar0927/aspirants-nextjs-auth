"use client";

import { SessionProvider } from "next-auth/react";
import ConsentProvider, { type ConsentState } from "./ConsentProvider";
import AnalyticsGate from "./AnalyticsGate";
import CookiePopup from "@/components/layout/cookie-popup";
import I18nProvider from "@/components/i18n/I18nProvider";

/**
 * Single wrapper mounted once in every route-group layout (there is no root
 * layout). Provides session + consent context, the cookie banner, and the
 * consent-gated analytics — replacing the unconditional <VercelAnalytics/> that
 * each layout used to render directly.
 *
 * `initialConsent` is the server-known consent for signed-in users (from
 * User.analyticsConsent), passed to avoid a flash before the cookie is read.
 */
export default function ComplianceProviders({
  children,
  initialConsent,
}: {
  children?: React.ReactNode;
  initialConsent?: ConsentState | null;
}) {
  return (
    <I18nProvider>
      <SessionProvider>
        <ConsentProvider initialConsent={initialConsent}>
          {children}
          <CookiePopup />
          <AnalyticsGate />
        </ConsentProvider>
      </SessionProvider>
    </I18nProvider>
  );
}

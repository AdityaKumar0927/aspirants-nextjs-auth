"use client";

import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useSession } from "next-auth/react";
import { useConsent } from "./ConsentProvider";

/**
 * Loads analytics ONLY when the visitor has opted in AND is not a self-declared
 * minor (DPDP Rule 10 forbids tracking/profiling of children). Replaces the
 * unconditional <VercelAnalytics/> that previously sat in every layout.
 */
export default function AnalyticsGate() {
  const { analytics } = useConsent();
  const { data: session } = useSession();
  const isMinor = session?.user?.isMinor === true;

  if (!analytics || isMinor) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <VercelAnalytics />
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
    </>
  );
}

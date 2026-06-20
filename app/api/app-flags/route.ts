import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/app-config";

/**
 * PUBLIC, unauthenticated flags for client surfaces (e.g. a signup form deciding
 * whether to render a CAPTCHA, or a pricing page deciding whether to show
 * prices). Deliberately exposes ONLY the handful of booleans that are safe to
 * reveal — never the abuse lists, security toggles, or rate-limit numbers.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getAppConfig();
  return NextResponse.json(
    {
      registrationOpen: cfg.registrationOpen,
      captchaEnabled: cfg.captchaEnabled,
      pricingVisible: cfg.pricingVisible,
      maintenanceMode: cfg.maintenanceMode,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

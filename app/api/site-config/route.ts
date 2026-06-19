import { NextResponse } from "next/server";
import { getSiteName } from "@/lib/site-config";

/**
 * Public read of the site name — consumed by the client/i18n layer
 * (components/i18n/I18nProvider.tsx → setSiteName) so translated strings and
 * client components can resolve the {{siteName}} token. No auth: the name is
 * shown to everyone. Backed by getSiteName(), which reads fresh per request, so
 * an admin rename is reflected on the next read.
 */
export async function GET() {
  // no-store so the client always reads the current name on load (a rename takes
  // effect immediately; the underlying query is a single cheap PK lookup).
  const res = NextResponse.json({ name: await getSiteName() });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

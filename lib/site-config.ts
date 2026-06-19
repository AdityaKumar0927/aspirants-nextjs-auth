import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";

/**
 * Site-wide configuration (the editable site name). Single source of truth for
 * server-rendered surfaces: nav, footer, page metadata, OG image, email, legal
 * prose. The client + translated strings read the same value via i18next's
 * {{siteName}} interpolation variable (see components/i18n/i18n.ts), fed from the
 * public GET /api/site-config — both ultimately come from the SiteConfig DB row.
 */

export const DEFAULT_SITE_NAME = "Penwise" as const;

/**
 * The current site name. Wrapped in React `cache()` so the many callers in one
 * render (nav, footer, generateMetadata, …) share a single DB query, but it is
 * NOT cached across requests — so an admin rename is reflected on the very next
 * request, no revalidation/redeploy needed. Fails SOFT to DEFAULT_SITE_NAME if
 * the table doesn't exist yet (before `npm run db:push`) or on any DB error, so
 * it's safe to call during build-time prerender and in generateMetadata().
 */
export const getSiteName = cache(async (): Promise<string> => {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { id: 1 } });
    return row?.name?.trim() || DEFAULT_SITE_NAME;
  } catch {
    return DEFAULT_SITE_NAME;
  }
});

/**
 * Build a page's Metadata with the live site name appended to the title.
 * `buildMetadata("Mock exam")` → "Mock exam — <name>"; `buildMetadata()` → "<name>".
 * Pass through description/metadataBase/etc. via `extra`.
 */
export async function buildMetadata(
  pageTitle?: string,
  extra?: Omit<Metadata, "title">,
): Promise<Metadata> {
  const name = await getSiteName();
  return {
    title: pageTitle ? `${pageTitle} — ${name}` : name,
    ...extra,
  };
}

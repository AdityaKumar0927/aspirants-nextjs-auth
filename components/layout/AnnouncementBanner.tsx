import { getActiveAnnouncements } from "@/lib/announcements";
import { getCurrentSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AnnouncementBannerClient } from "./AnnouncementBannerClient";

/**
 * Server component: reads the currently-active announcements scoped to the
 * viewer's subscription tier (so FREE/PREMIUM/INSTITUTION-targeted banners reach
 * the right cohort, not just "ALL"), and hands them to the client banner, which
 * handles per-banner dismissal. Fails soft to ALL-only / nothing.
 */
export async function AnnouncementBanner() {
  let audience: string | null = null;
  try {
    const session = await getCurrentSession();
    if (session?.user?.id) {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionTier: true },
      });
      audience = u?.subscriptionTier ?? null;
    }
  } catch {
    /* fail soft — show ALL-audience banners only */
  }

  const items = await getActiveAnnouncements(audience);
  if (!items.length) return null;
  return <AnnouncementBannerClient items={items} />;
}

import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";

/**
 * Sitewide announcement banners. getActiveAnnouncements() returns the banners
 * that should be visible right now — active, within their [startsAt, endsAt]
 * window when set, and matching the viewer's audience (ALL, or their tier).
 *
 * Request-scoped-cached and fail-soft (returns [] on any error / missing table),
 * so it's safe to call from any layout without a try/catch.
 */

export type AnnouncementType = "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";

export interface ActiveAnnouncement {
  id: string;
  message: string;
  type: AnnouncementType;
  dismissible: boolean;
}

export const getActiveAnnouncements = cache(
  async (audience?: string | null): Promise<ActiveAnnouncement[]> => {
    try {
      const now = new Date();
      const rows = await prisma.announcement.findMany({
        where: {
          active: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      const tier = (audience ?? "").toUpperCase();
      return rows
        .filter((r) => r.audience === "ALL" || (tier && r.audience.toUpperCase() === tier))
        .map((r) => ({
          id: r.id,
          message: r.message,
          type: r.type as AnnouncementType,
          dismissible: r.dismissible,
        }));
    } catch {
      return [];
    }
  }
);

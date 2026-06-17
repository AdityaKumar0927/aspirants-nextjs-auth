import { z } from "zod"

/**
 * Canonical validation for user profile/account settings writes. Shared by
 * /api/settings/[userId] and the legacy /api/settings/profile-settings and
 * /api/settings/account-settings routes so all three enforce the same trim /
 * length / email / JSON-size bounds (no unbounded strings reaching Prisma).
 */
export const settingsSchema = z.object({
  username: z.string().trim().max(100).optional(),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  bio: z.string().max(2_000).optional(),
  name: z.string().trim().max(200).optional(),
  language: z.string().trim().max(40).optional(),
  // urls is a Json column; bound its serialized size.
  urls: z
    .unknown()
    .optional()
    .refine(
      (v) => v === undefined || JSON.stringify(v).length <= 5_000,
      "urls payload too large"
    ),
})

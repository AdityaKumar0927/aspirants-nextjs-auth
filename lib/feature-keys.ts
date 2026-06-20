/**
 * Client-safe catalog of the per-feature kill switches. Lives in its own module
 * (no "server-only", no Prisma) so both the server config reader (lib/app-config)
 * and the admin UI can import it. A feature is ON unless its key is explicitly
 * set to `false` in AppConfig.features.
 */
export type FeatureKey =
  | "aiHints"
  | "pdfExtraction"
  | "userBanks"
  | "learn"
  | "leaderboard"
  | "featureRequests";

export const FEATURE_KEYS: { key: FeatureKey; label: string; description: string }[] = [
  { key: "aiHints", label: "AI hints", description: "Streaming STEM hints (/api/openai)." },
  { key: "pdfExtraction", label: "PDF → question bank", description: "PDF extraction import (/api/import/extract)." },
  { key: "userBanks", label: "Bring-your-own banks", description: "Student-generated private question banks." },
  { key: "learn", label: "Learn", description: "The no-API-key understanding engine." },
  { key: "leaderboard", label: "Merit list", description: "Public leaderboard / rankings." },
  { key: "featureRequests", label: "Feature requests", description: "Public roadmap board." },
];

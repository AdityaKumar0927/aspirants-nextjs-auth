import type { MetadataRoute } from "next";

const BASE = "https://penwise-git-main-aditya-kumar-s-projects.vercel.app";

// Keep sensitive / private areas out of search indexes. (Advisory — good bots
// obey it; real enforcement is the per-route auth guards + rate limiting.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/administrator",
        "/api",
        "/onboarding",
        "/forms",
        "/suspended",
        "/parental-consent",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}

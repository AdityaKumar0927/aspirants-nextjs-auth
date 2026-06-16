import { MetadataRoute } from "next";
import { listBlueprintExams } from "@/lib/blueprint";

// Only list real, public pages. Internal user IDs must never appear in the
// public sitemap (it previously published a database user id under the root).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://penwise-git-main-aditya-kumar-s-projects.vercel.app";
  const lastModified = new Date();

  const staticRoutes = [
    "",
    "/question-bank",
    "/leaderboard",
    "/contact",
    "/mission",
    "/blueprint",
  ];

  // The exam blueprints are a key SEO surface — list each one.
  let blueprintRoutes: string[] = [];
  try {
    const exams = await listBlueprintExams();
    blueprintRoutes = exams.map((e) => `/blueprint/${e.exam}`);
  } catch {
    // If the corpus query fails at build time, ship the static routes anyway.
  }

  return [...staticRoutes, ...blueprintRoutes].map((path) => ({
    url: `${base}${path}`,
    lastModified,
  }));
}

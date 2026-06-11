import { MetadataRoute } from "next";

// Only list real, public pages. Internal user IDs must never appear in the
// public sitemap (it previously published a database user id under the root).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aspirants.tech";
  const routes = ["", "/question-bank", "/leaderboard", "/contact", "/mission"];
  const lastModified = new Date();
  return routes.map((path) => ({ url: `${base}${path}`, lastModified }));
}

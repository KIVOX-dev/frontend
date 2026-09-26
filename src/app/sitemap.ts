import type { MetadataRoute } from "next";
import { DOCS } from "@/content/docs";

const SITE_URL = "https://www.talentsnaps.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/for-hr", priority: 0.9, changeFrequency: "monthly" },
    { path: "/for-institutions", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about-us", priority: 0.7, changeFrequency: "monthly" },
    { path: "/partner-colleges", priority: 0.7, changeFrequency: "monthly" },
    { path: "/careers", priority: 0.6, changeFrequency: "monthly" },
  ];

  // Docs centre: every page for every audience it applies to.
  for (const doc of DOCS) {
    for (const audience of doc.audiences) {
      routes.push({ path: `/docs/${audience}/${doc.slug}`, priority: doc.group === "Legal" ? 0.3 : 0.5, changeFrequency: "monthly" });
    }
  }

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

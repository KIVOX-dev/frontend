import type { MetadataRoute } from "next";

const SITE_URL = "https://www.talentsnaps.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hr/",
          "/institutional/",
          "/faculty/",
          "/superadmin/",
          "/learner/",
          "/register/",
          "/reset-password/",
          "/forgot-password/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

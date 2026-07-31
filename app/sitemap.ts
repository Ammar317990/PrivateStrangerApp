import type { MetadataRoute } from "next";

const SITE_URL = "https://private-stranger-app.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  // /chat is excluded on purpose — it's a logged-in app screen, not
  // indexable content (see robots.ts).
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];
}

import type { MetadataRoute } from "next";

const SITE_URL = "https://private-stranger-app.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /chat is a logged-in app screen (redirects to /login when signed
      // out) — nothing there is content worth indexing.
      disallow: "/chat",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

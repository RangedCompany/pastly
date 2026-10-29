import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/u/"],
      disallow: [
        "/admin",
        "/dashboard",
        "/profile",
        "/notes/",
        "/auth/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

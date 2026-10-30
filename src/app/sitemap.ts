import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl(), changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl()}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl()}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl()}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

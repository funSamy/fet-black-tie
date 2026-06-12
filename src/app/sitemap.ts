import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/message`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/board`, changeFrequency: "daily", priority: 0.5 },
  ];
}

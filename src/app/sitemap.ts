import type { MetadataRoute } from "next";

const BASE_URL = "https://blacktie-sparkle.lovable.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/message`, changeFrequency: "monthly", priority: 0.5 },
  ];
}

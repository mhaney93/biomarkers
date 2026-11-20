import type { MetadataRoute } from "next";

// Keep crawlers out entirely; every response also carries X-Robots-Tag: noindex (next.config.ts).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}

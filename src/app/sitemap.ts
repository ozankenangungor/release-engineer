import type { MetadataRoute } from "next";
import { getPublishedCaseStudies } from "@/content/case-studies";

export default function sitemap(): MetadataRoute.Sitemap {
  const cases = getPublishedCaseStudies();
  return [
    "/",
    "/about",
    "/pricing",
    "/compare",
    "/case-studies/webhook-review",
    "/evidence",
    "/feedback",
    "/pilot",
    "/privacy",
    "/terms",
    ...(cases.length
      ? [
          "/case-studies",
          ...cases.map((study) => `/case-studies/${study.slug}`),
        ]
      : []),
  ].map((path) => ({
    url: new URL(path, "https://releaseengineer.tech").toString(),
  }));
}

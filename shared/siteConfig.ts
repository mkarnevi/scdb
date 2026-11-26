/**
 * Fork setting: this copy runs as a private catalogue unless PUBLIC_SITE=true.
 *
 * Private (default): no Google Analytics, no search engine pings on save,
 * robots.txt disallows everything, the sitemap is empty and pages are
 * marked noindex. PUBLIC_SITE=true restores upstream SketchTV.lol behaviour.
 */
export const isPublicSite = process.env.PUBLIC_SITE === "true";

/** Base URL for metadata and absolute links */
export const siteUrl =
  process.env.SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

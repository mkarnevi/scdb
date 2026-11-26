import { isPublicSite } from "@/shared/siteConfig";
import { MetadataRoute } from "next";

/** Private copies (the fork's default) ask every crawler to stay out */
export default function robots(): MetadataRoute.Robots {
  if (!isPublicSite) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.sketchtv.lol/sitemap.xml/*",
  };
}

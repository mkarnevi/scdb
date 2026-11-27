import { buildPageMeta } from "@/shared/metaBuilder";
import {
  isPublicSite,
  siteDescription,
  siteName,
  siteUrl,
} from "@/shared/siteConfig";
import { Container } from "@mui/material";
import type { Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import AppFooter from "./footer/AppFooter";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter";
import "./globals.css";
import ResponsiveAppBar from "./header/ResponsiveAppBar";
import { NextAuthProvider } from "./providers/NextAuthProvider";
import ThemeRegistry from "./providers/ThemeRegistry";

/** Longer title important for SEO */
export const metadata = buildPageMeta(siteName, siteDescription, "/", []);

metadata.metadataBase = new URL(
  isPublicSite ? "https://www.sketchtv.lol" : siteUrl,
);
if (!isPublicSite) {
  metadata.robots = { index: false, follow: false };
}
// Fork: icons come from app/icon.svg and app/apple-icon.png

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  return (
    <html lang="en">
      <head>
        {isPublicSite && (
          <link
            rel="sitemap"
            type="application/xml"
            href="https://www.sketchtv.lol/sitemap.xml"
          />
        )}
        {!isDevelopment && isPublicSite && (
          <>
            <Script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-ZPKZL2PP9B"
            />
            <Script
              id="gtag"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag() {
                      dataLayer.push(arguments);
                  }
                  gtag("js", new Date());

                  gtag("config", "G-ZPKZL2PP9B");
                  `,
              }}
            />
          </>
        )}
      </head>
      <body className="bodyColor">
        <NextAuthProvider>
          <ThemeRegistry options={{ key: "mui" }}>
            <Suspense fallback={<div style={{ height: "48px" }} />}>
              <ResponsiveAppBar />
            </Suspense>
            <Container style={{ marginTop: 8 }} maxWidth="md">
              {children}
            </Container>
            <AppFooter />
          </ThemeRegistry>
        </NextAuthProvider>
      </body>
    </html>
  );
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fork: a self-contained server build for the Docker image
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    // Fork: only when S3 is used; local image storage serves from /static
    remotePatterns: process.env.NEXT_PUBLIC_STATIC_HOSTNAME
      ? [
          {
            protocol: "https",
            hostname: process.env.NEXT_PUBLIC_STATIC_HOSTNAME,
            port: "",
            // Inclusive so bad cdn key doesn't crash the page, and it's easier to diagnose the issue
            pathname: "/**",
          },
        ]
      : [],
  },
};

module.exports = withBundleAnalyzer(nextConfig);

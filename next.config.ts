import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: "export",

  // No basePath: the site is served at the root of the custom domain
  // (www.validagent.org), not under /validagent/ anymore.
  basePath: "",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;

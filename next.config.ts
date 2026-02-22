import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: "export",

  // Base path for GitHub Pages deployment
  // Replace 'tuhh-agent-repov_v2' with your actual repository name
  basePath: process.env.NODE_ENV === "production" ? "/validagent" : "",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;

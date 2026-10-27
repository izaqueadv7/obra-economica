import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: "export" as const, trailingSlash: true } : {}),
  images: { unoptimized: isGitHubPages },
  ...(isGitHubPages
    ? { basePath: "/obra-economica" }
    : {}),
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // skip ESLint during next build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // skip TypeScript checks during next build (dangerous — see note)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

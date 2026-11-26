import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Variants are pre-built by scripts/build-images.mjs; see src/ui/picture.tsx.
    deviceSizes: [640, 1024, 1600, 2400],
    imageSizes: [128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;

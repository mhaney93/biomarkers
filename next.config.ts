import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Progress photo uploads (lib/photos.ts MAX_PHOTO_BYTES plus multipart overhead).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;

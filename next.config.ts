import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1 MB body limit, which a real phone
    // camera photo or a scanned PDF document blows past immediately.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;

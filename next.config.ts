import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1 MB body limit, which a real phone
    // camera photo or a scanned PDF document blows past immediately.
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  // The PDF report route loads its fonts from disk at runtime (pdfkit
  // registerFont), but Next's build trace doesn't follow that dynamic
  // fs.readFileSync path, so the .ttf files never made it into the
  // deployed serverless function bundle — breaking the download in
  // production while working fine locally. Force them in explicitly.
  outputFileTracingIncludes: {
    "/api/rapoarte-lucrare/[id]": ["./src/app/api/rapoarte-lucrare/[id]/fonts/**"],
  },
};

export default nextConfig;

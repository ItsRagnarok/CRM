import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Versiunea construită (commit-ul de pe Vercel): pagina deschisă o compară cu cea de pe server și
  // se reîncarcă după o actualizare (src/components/version-watcher.tsx).
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "local",
  },
  async redirects() {
    return [
      { source: "/blog/index.html", destination: "/blog", permanent: true },
      { source: "/blog/index", destination: "/blog", permanent: true },
      { source: "/blog/:slug.html", destination: "/blog/:slug", permanent: true },
      { source: "/signup", destination: "/programare", permanent: false },
      { source: "/programare.html", destination: "/programare", permanent: true },
    ];
  },
  async headers() {
    return [
      // Service worker-ul aplicației: telefonul verifică mereu versiunea nouă după un deploy.
      // Analitice: Chrome pe Android trimite modelul telefonului (ex. SM-S918B) doar dacă îl cerem.
      { source: "/:path*", headers: [{ key: "Accept-CH", value: "Sec-CH-UA-Model, Sec-CH-UA-Platform-Version" }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] },
    ];
  },
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
    "/api/facturi/[id]/pdf": ["./src/app/api/rapoarte-lucrare/[id]/fonts/**"],
    "/status/[token]/raport": ["./src/app/api/rapoarte-lucrare/[id]/fonts/**"],
  },
  // pdf.js (vizualizatorul de PDF din aplicație) cere opțional modulul „canvas” de Node; în browser nu e nevoie de el.
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias ?? {}), canvas: false };
    return config;
  },
  // Blog static: /blog arată public/blog/index.html,
  // /blog/un-articol arată public/blog/un-articol.html
  async rewrites() {
    return [
      { source: "/blog", destination: "/blog/index.html" },
      { source: "/blog/:slug", destination: "/blog/:slug.html" },
      // Pagina de programări: /programare arată public/programare.html
      { source: "/programare", destination: "/programare.html" },
    ];
  },
};

export default nextConfig;

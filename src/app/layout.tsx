import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PreventZoom } from "@/components/prevent-zoom";
import { SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-variable.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const unbounded = localFont({
  src: "./fonts/unbounded-variable.ttf",
  variable: "--font-unbounded",
  weight: "200 900",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-variable.ttf",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ElectroField",
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  // Public marketing pages opt in explicitly. App and account pages stay out of search.
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c1c22",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ro"
      suppressHydrationWarning
      className={`${inter.variable} ${unbounded.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: 'try{document.documentElement.dataset.theme=localStorage.getItem("ef-theme")==="dark"?"dark":"light"}catch(e){}' }} />
        <PreventZoom />
        {children}
      </body>
    </html>
  );
}

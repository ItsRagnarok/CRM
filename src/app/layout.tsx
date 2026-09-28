import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PreventZoom } from "@/components/prevent-zoom";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElectroField",
  description: "Echipă. Lucrări. Control.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PreventZoom />
        {children}
      </body>
    </html>
  );
}

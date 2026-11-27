import type { Metadata } from "next";

export const SITE_URL = "https://www.electrofield.ro";
export const SITE_DESCRIPTION =
  "ElectroField leagă biroul de echipele din teren: lucrări, pontaj, documente ANRE, stoc pe mașini și facturare pentru firme de instalații electrice, gaze și fotovoltaice.";

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    // Titlul complet, fără șablonul din layout (sub 60 de caractere, cu termenul căutat la început).
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "ro_RO",
      siteName: "ElectroField",
      title,
      description,
      url,
      images: [{ url: `${SITE_URL}/marketing/og-van-dusk.jpg`, width: 1200, height: 630, alt: "ElectroField, program pentru firme de instalații cu echipe în teren" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/marketing/og-van-dusk.jpg`],
    },
  };
}

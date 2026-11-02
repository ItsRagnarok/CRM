import type { Metadata } from "next";

export const SITE_URL = "https://www.electrofield.ro";
export const SITE_DESCRIPTION =
  "CRM pentru firme de instalații și echipe de teren din România. Gestionează lucrări, clienți, programări, pontaj, materiale și rapoarte cu ElectroField.";

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
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
      images: [{ url: `${SITE_URL}/marketing/van-dusk.jpg`, alt: "ElectroField — gestionarea echipelor de teren" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/marketing/van-dusk.jpg`],
    },
  };
}

import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONE_TEL, LEGAL_CUI, LEGAL_REG, LEGAL_SEAT } from "./contact";

export const SITE_URL = "https://www.electrofield.ro";
export const SITE_NAME = "ElectroField";
/** Sub 155 de caractere; doar ce face platforma acum (vezi faptele verificate despre produs). */
export const SITE_DESCRIPTION =
  "ElectroField leagă biroul de echipele din teren: lucrări, pontaj, stoc pe mașini și facturare, pentru firme de instalații electrice, gaze și fotovoltaice.";

/** Imaginea Open Graph implicită (1200×630), când pagina nu are una proprie. */
export const DEFAULT_OG_IMAGE = "/marketing/og-van-dusk.jpg";
export const DEFAULT_OG_ALT = "ElectroField, program pentru firme de instalații cu echipe în teren";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;

/** URL absolut pe site pentru o cale („/og/x.jpg” → „https://www.electrofield.ro/og/x.jpg”). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type PublicPageOptions = {
  /** Cale pe site sau URL absolut; implicit DEFAULT_OG_IMAGE. Imaginea trebuie să fie 1200×630. */
  ogImage?: string;
  ogAlt?: string;
  type?: "website" | "article";
};

export function publicPageMetadata(title: string, description: string, path: string, opts: PublicPageOptions = {}): Metadata {
  const url = `${SITE_URL}${path}`;
  const image = absoluteUrl(opts.ogImage ?? DEFAULT_OG_IMAGE);
  const alt = opts.ogAlt ?? DEFAULT_OG_ALT;
  return {
    // Titlul complet, fără șablonul din layout (sub 60 de caractere, cu termenul căutat la început).
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: opts.type ?? "website",
      locale: "ro_RO",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt }],
    },
  };
}

/** Datele structurate ca text pentru <script type="application/ld+json"> (fără „<” care să închidă scriptul). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Organizația din spatele site-ului, doar cu datele publicate pe site (src/lib/contact.ts): fără numele
 * persoanei din denumirea PFA, deci fără legalName. sameAs lipsește intenționat: nu există încă profiluri
 * publice (LinkedIn, Facebook, Google Business Profile); se adaugă aici când apar.
 */
export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: `${SITE_URL}/icon-512.png`,
      contentUrl: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
      caption: SITE_NAME,
    },
    image: { "@id": `${SITE_URL}/#logo` },
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_TEL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE_TEL,
      availableLanguage: "ro",
      areaServed: "RO",
    },
    address: { "@type": "PostalAddress", addressLocality: LEGAL_SEAT, addressCountry: "RO" },
    taxID: LEGAL_CUI,
    identifier: [
      { "@type": "PropertyValue", propertyID: "CUI", value: LEGAL_CUI },
      { "@type": "PropertyValue", propertyID: "Nr. de ordine în Registrul Comerțului", value: LEGAL_REG },
    ],
    areaServed: { "@type": "Country", name: "Romania" },
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "ro-RO",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Funcțiile din lista de mai jos sunt doar cele verificate în cod. Fără offers (prețurile nu se publică)
 * și fără aggregateRating (nu există recenzii): nu se inventează.
 */
export const SOFTWARE_FEATURES = [
  "Programarea lucrărilor pe echipe și zile, cu avertismente la programare",
  "Aplicația Android (APK) pentru tehnicieni; pe iPhone, din browser",
  "Poze etichetate, checklisturi, măsurători și semnătura clientului pe ecran",
  "Pontaj pe lucrare, cu corecții aprobate de birou și export",
  "Hartă cu lucrările active, echipele și depozitele",
  "Foaie de parcurs lunară pe mașină, din lucrările terminate",
  "Stoc pe mașini, depozite și registru de scule",
  "Evidența autorizațiilor, ITP, RCA și calibrărilor, cu alertă înainte de expirare",
  "Măsurători electrice din teren și proces-verbal de lucrări ascunse",
  "Scadențar pentru verificări și revizii gaze, cu fișa de evidență din telefon",
  "Dosar fotovoltaic pe etape, cu termenele operatorului și formularul de punere în funcțiune",
  "Facturare din lucrări prin SmartBill sau Oblio",
];

export function softwareJsonLd() {
  return {
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    inLanguage: "ro-RO",
    featureList: SOFTWARE_FEATURES,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

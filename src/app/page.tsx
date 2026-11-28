import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { HOME_FAQ } from "@/components/marketing/home-faq";
import { stripInlineLinks } from "@/lib/inline-links";
import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  ORGANIZATION_ID,
  organizationJsonLd,
  publicPageMetadata,
  serializeJsonLd,
  SITE_URL,
  SOFTWARE_ID,
  softwareJsonLd,
  WEBSITE_ID,
  websiteJsonLd,
} from "@/lib/seo";

// Pagina principală deține interogarea „software de management pentru electricieni și echipe de teren / echipe
// mobile”, brandul și „program pentru firme de instalații”. Titlu ≤ 60 de caractere, descriere 140–155.
const TITLE = "Software de management pentru electricieni și echipe mobile";
const DESCRIPTION =
  "Software de management pentru electricieni, instalatori și echipe mobile: lucrări pe echipe, aplicația tehnicianului, pontaj, stoc pe mașini și facturare.";
/** Data ultimei modificări reale a textului paginii principale (AAAA-LL-ZZ). */
const UPDATED = "2026-11-28";

export const metadata = publicPageMetadata(TITLE, DESCRIPTION, "/");

const HOME_URL = `${SITE_URL}/`;
const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${HOME_URL}#webpage`,
      url: HOME_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "ro-RO",
      dateModified: UPDATED,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": SOFTWARE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: ogImage, contentUrl: ogImage, width: 1200, height: 630 },
    },
    websiteJsonLd(),
    organizationJsonLd(),
    softwareJsonLd(),
    {
      "@type": "FAQPage",
      "@id": `${HOME_URL}#faq`,
      isPartOf: { "@id": `${HOME_URL}#webpage` },
      inLanguage: "ro-RO",
      mainEntity: HOME_FAQ.map((f) => ({
        "@type": "Question",
        name: stripInlineLinks(f.q),
        acceptedAnswer: { "@type": "Answer", text: stripInlineLinks(f.a) },
      })),
    },
  ],
};

// Pagina principală e statică (servită din cache, rapidă pentru Google). Cine e logat e trimis din
// middleware la /start, care alege panoul potrivit rolului.
export default function RootPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <MarketingLanding />
    </>
  );
}

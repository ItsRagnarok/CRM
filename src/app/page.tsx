import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { publicPageMetadata, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";
import { HOME_FAQ } from "@/components/marketing/home-faq";

export const metadata = publicPageMetadata(
  "Program pentru firme de instalații electrice, gaze și PV",
  "ElectroField: lucrări, echipe, pontaj, foaie de parcurs, stoc pe mașini, documente ANRE și facturare SmartBill/Oblio pentru firme de instalații electrice, gaze și fotovoltaice.",
  "/",
);

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "ElectroField",
      inLanguage: "ro-RO",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ElectroField",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      email: "contact@electrofield.ro",
      telephone: "+40750425670",
      areaServed: { "@type": "Country", name: "Romania" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "ElectroField",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Android",
      inLanguage: "ro-RO",
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: ["Programarea lucrărilor pe echipe", "Aplicație mobilă pentru tehnicieni (Android, iPhone)", "Pontaj din teren", "Foaie de parcurs", "Stoc pe mașini și registru de scule", "Buletine PRAM și de izolație", "Scadențar verificări și revizii gaze", "Dosar fotovoltaic pe etape", "Facturare prin SmartBill și Oblio"],
    },
    {
      "@type": "FAQPage",
      mainEntity: HOME_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

// Pagina principală e statică (servită din cache, rapidă pentru Google). Cine e logat e trimis din
// middleware la /start, care alege panoul potrivit rolului.
export default function RootPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <MarketingLanding />
    </>
  );
}

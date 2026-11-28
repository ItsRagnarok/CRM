/**
 * Paginile publice pe meserie și pe funcționalitate (SEO): fiecare răspunde la ce caută o firmă de
 * instalații și descrie doar ce face platforma acum. Le servește src/app/[slug]/page.tsx.
 * Conținutul fiecărei pagini stă în src/lib/marketing-content/<slug>.ts: date simple, fără importuri
 * de Node, ca să poată fi citit și de sitemap și de middleware (rute publice, rulează pe edge).
 *
 * Legături în text: în orice șir afișat (lead, answer, p, list, steps, celulele tabelului, callout,
 * răspunsurile din FAQ) scrii [textul legăturii](/cale). Vezi src/lib/inline-links.ts.
 */
import softwareManagementEchipeTeren from "./marketing-content/software-management-echipe-teren";
import firmeInstalatiiElectrice from "./marketing-content/firme-instalatii-electrice";
import firmeGazeVerificariRevizii from "./marketing-content/firme-gaze-verificari-revizii";
import firmeFotovoltaice from "./marketing-content/firme-fotovoltaice";
import pontajTehnicieni from "./marketing-content/pontaj-tehnicieni";
import foaieDeParcursElectronica from "./marketing-content/foaie-de-parcurs-electronica";
import aplicatieTehnician from "./marketing-content/aplicatie-tehnician";
import facturareSmartbillOblio from "./marketing-content/facturare-smartbill-oblio";
import stocMaterialePeMasini from "./marketing-content/stoc-materiale-pe-masini";
import despre from "./marketing-content/despre";

/** Bloc de conținut dintr-o secțiune, afișat după answer, p și list, în ordinea din listă. */
export type MarketingBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  /** Pași numerotați (<ol>). */
  | { type: "steps"; items: string[] }
  /** Tabel; pe telefon se derulează orizontal. Fiecare rând are câte o celulă pentru fiecare coloană din head. */
  | { type: "table"; caption?: string; head: string[]; rows: string[][] }
  /** Casetă evidențiată (de reținut, atenție). */
  | { type: "callout"; title?: string; text: string };

export type MarketingSection = {
  h: string;
  /** Ancoră pentru legături de tipul /pagina#id (litere mici, cifre și cratime). */
  id?: string;
  /** Răspunsul direct la întrebarea din titlu (40–60 de cuvinte), afișat imediat sub H2. */
  answer?: string;
  p?: string[];
  list?: string[];
  blocks?: MarketingBlock[];
};

export type MarketingPage = {
  slug: string;
  /** Sub 60 de caractere, cu termenul căutat la început. */
  title: string;
  /** 140–155 de caractere. */
  description: string;
  kicker: string;
  h1: string;
  lead: string;
  sections: MarketingSection[];
  faq: { q: string; a: string }[];
  /** Articole din /blog legate de subiect (slug-uri). */
  related: string[];
  /** Data ultimei modificări reale a textului (AAAA-LL-ZZ): sitemap, „Actualizat la” și dateModified. */
  updated: string;
  /** Imaginea Open Graph, cale pe site (implicit /og/<slug>.jpg, dacă fișierul există în public/). */
  ogImage?: string;
  /** Nume scurt pentru firul de navigare, BreadcrumbList și subsol (implicit h1). */
  breadcrumb?: string;
};

export const MARKETING_PAGES: MarketingPage[] = [
  softwareManagementEchipeTeren,
  firmeInstalatiiElectrice,
  firmeGazeVerificariRevizii,
  firmeFotovoltaice,
  pontajTehnicieni,
  foaieDeParcursElectronica,
  aplicatieTehnician,
  facturareSmartbillOblio,
  stocMaterialePeMasini,
  despre,
];

export const MARKETING_SLUGS = MARKETING_PAGES.map((p) => p.slug);
export const marketingPage = (slug: string) => MARKETING_PAGES.find((p) => p.slug === slug);

/** Numele scurt al paginii (fir de navigare, subsol). */
export const breadcrumbName = (page: MarketingPage) => page.breadcrumb ?? page.h1;
/** Calea imaginii Open Graph cerute de pagină (existența fișierului o verifică pagina). */
export const ogImagePath = (page: MarketingPage) => page.ogImage ?? `/og/${page.slug}.jpg`;

const RO_MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

/** „2026-11-28” → „28 noiembrie 2026”. Fără Intl, ca să iasă la fel pe orice server. */
export function formatRoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? Number(m[2]) : 0;
  if (!m || month < 1 || month > 12) return iso;
  return `${Number(m[3])} ${RO_MONTHS[month - 1]} ${m[1]}`;
}

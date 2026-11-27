import Link from "next/link";
import { HOME_FAQ } from "./home-faq";
import s from "./marketing.module.css";

const TRADES = [
  { href: "/firme-instalatii-electrice", h: "Instalații electrice", p: "Buletine PRAM și de izolație, lucrări ascunse cu poze, autorizații ANRE și marjă pe lucrare." },
  { href: "/firme-gaze-verificari-revizii", h: "Verificări și revizii gaze", p: "Scadențar pe bloc și apartament, fișa de evidență și termenele de după lucrare (Ord. 179/2015)." },
  { href: "/firme-fotovoltaice", h: "Montaj fotovoltaic", p: "Dosar pe etape, termenele operatorului cu ceas, PIF pe string și proces-verbal de punere în funcțiune." },
];
const FEATURES = [
  { href: "/aplicatie-tehnician", h: "Aplicația tehnicianului" },
  { href: "/pontaj-tehnicieni", h: "Pontaj din teren" },
  { href: "/foaie-de-parcurs-electronica", h: "Foaie de parcurs" },
  { href: "/stoc-materiale-pe-masini", h: "Stoc pe mașini și scule" },
  { href: "/facturare-smartbill-oblio", h: "Facturare SmartBill și Oblio" },
];
const GUIDES = [
  { href: "/blog/fisa-evidenta-verificare-revizie-gaze-scadentar", h: "Fișa de evidență gaze și scadențarul pe bloc" },
  { href: "/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate", h: "Verificarea PRAM: periodicitate și buletin" },
  { href: "/blog/proces-verbal-punere-in-functiune-fotovoltaic-model", h: "Proces-verbal de punere în funcțiune fotovoltaic" },
  { href: "/blog/calculator-tarif-ora-electrician-instalator", h: "Calculator: tariful minim pe oră" },
  { href: "/blog/evidenta-orelor-tehnicieni-teren-pontaj", h: "Pontajul tehnicienilor din teren" },
  { href: "/blog/e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice", h: "e-Factura 2026 pentru firmele de instalații" },
];

/**
 * Text vizibil și legături interne pe pagina principală: pentru cine e platforma, ce face și
 * întrebările frecvente. Fără animații, ca Google și cititorul să le vadă din prima.
 */
export function HomeSeo() {
  return (
    <section id="pentru-cine" className={s.seo} aria-labelledby="seo-title">
      <div className={s.wrap}>
        <h2 id="seo-title" className={s.disp}>Program pentru firme de instalații electrice, gaze și fotovoltaice</h2>
        <p className={s.seoLead}>
          ElectroField leagă biroul de echipele din teren: programezi lucrările pe echipe, tehnicianul le face din telefon cu poze, măsurători și semnătura clientului,
          iar tu vezi pe loc ce s-a lucrat, ce s-a consumat și ce e de facturat. Documentele cerute de ANRE și de operatori ies din datele de pe teren, nu din caiete recopiate.
        </p>
        <div className={s.seoGrid}>
          {TRADES.map((t) => (
            <Link key={t.href} href={t.href} className={s.seoCard}>
              <h3>{t.h}</h3>
              <p>{t.p}</p>
              <span>Vezi cum lucrează firmele de {t.h.toLowerCase()} →</span>
            </Link>
          ))}
        </div>

        <h2 className={s.disp}>Ce face platforma</h2>
        <ul className={s.seoPills}>
          {FEATURES.map((f) => <li key={f.href}><Link href={f.href}>{f.h}</Link></li>)}
        </ul>

        <h2 className={s.disp}>Ghiduri pentru firmele de instalații</h2>
        <ul className={s.seoGuides}>
          {GUIDES.map((g) => <li key={g.href}><Link href={g.href}>{g.h}</Link></li>)}
          <li><Link href="/blog">Toate ghidurile →</Link></li>
        </ul>

        <h2 className={s.disp}>Întrebări frecvente</h2>
        <div className={s.seoFaq}>
          {HOME_FAQ.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

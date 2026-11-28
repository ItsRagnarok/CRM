import { StaticLink } from "@/components/static-link";
import Link from "next/link";
import { HOME_FAQ } from "./home-faq";
import s from "./marketing.module.css";

const TRADES = [
  { href: "/firme-instalatii-electrice", h: "Instalații electrice", p: "Buletine PRAM și de izolație, lucrări ascunse cu poze, autorizații ANRE și marjă pe lucrare.", link: "Firme de electrice" },
  { href: "/firme-gaze-verificari-revizii", h: "Verificări și revizii gaze", p: "Scadențar pe bloc și apartament, fișa de evidență și termenele de după lucrare (Ord. 179/2015).", link: "Firme de gaze" },
  { href: "/firme-fotovoltaice", h: "Montaj fotovoltaic", p: "Dosar pe etape, termenele operatorului cu ceas, PIF pe string și proces-verbal de punere în funcțiune.", link: "Firme de fotovoltaice" },
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
 * Text vizibil și legături interne pe pagina principală: pentru cine e platforma, ghidurile și
 * întrebările frecvente. Așezare sobră, fără chenare și pastile: meseriile pe coloane despărțite de
 * linii, ghidurile ca listă. Funcțiile au linkurile în subsol și modulele în „Un singur sistem”.
 */
export function HomeSeo() {
  return (
    <section id="pentru-cine" className={s.seo} aria-labelledby="seo-title">
      <div className={s.wrap}>
        <h2 id="seo-title" className={s.disp}>Program pentru firme de instalații electrice, gaze și fotovoltaice</h2>
        <p className={s.seoLead}>
          ElectroField leagă biroul de <Link href="/software-management-echipe-teren">echipele din teren</Link>: programezi lucrările pe echipe, tehnicianul le face din telefon cu poze, măsurători și semnătura clientului,
          iar tu vezi pe loc ce s-a lucrat, ce s-a consumat și ce e de facturat. Documentele cerute de ANRE și de operatori ies din datele de pe teren, nu din caiete recopiate.
        </p>
        <div className={s.seoTrades}>
          {TRADES.map((t) => (
            <div key={t.href} className={s.seoTrade}>
              <h3>{t.h}</h3>
              <p>{t.p}</p>
              <Link href={t.href}>{t.link} →</Link>
            </div>
          ))}
        </div>

        <h2 className={s.disp}>Ghiduri pentru firmele de instalații</h2>
        <ul className={s.seoGuides}>
          {GUIDES.map((g) => <li key={g.href}><StaticLink href={g.href}>{g.h}</StaticLink></li>)}
        </ul>
        <p className={s.seoAll}><StaticLink href="/blog">Toate ghidurile →</StaticLink></p>

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

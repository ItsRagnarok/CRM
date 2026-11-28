import { StaticLink } from "@/components/static-link";
import Link from "next/link";
import { HOME_FAQ } from "./home-faq";
import { RichText } from "./rich-text";
import s from "./marketing.module.css";

// Textele urmează fișa de fapte verificate despre produs (R3, secțiunea 4): fără buletine PRAM „generate”,
// fără importuri de clienți sau materiale, fără prețuri și fără nume de alte produse.
const TRADES = [
  {
    href: "/firme-instalatii-electrice",
    h: "Instalații electrice",
    p: "Măsurători pe circuite din telefon, lucrări ascunse cu poze și proces-verbal tipărit; buletinul se înregistrează doar cu un semnatar care are autorizație ANRE valabilă.",
    link: "Firme de electrice",
  },
  {
    href: "/firme-gaze-verificari-revizii",
    h: "Verificări și revizii gaze",
    p: "Scadențar pe bloc, scară și apartament, fișa de evidență completată și semnată pe telefon, termenele de după fișă și registrul anual.",
    link: "Firme de gaze",
  },
  {
    href: "/firme-fotovoltaice",
    h: "Montaj fotovoltaic",
    p: "Dosar pe etape, de la contract și montaj la ATR și AFM, ceas pentru termenele operatorului și fișa de punere în funcțiune pe fiecare string.",
    link: "Firme de fotovoltaice",
  },
];
const GUIDES = [
  { href: "/blog/model-foaie-de-parcurs", h: "Model de foaie de parcurs și cum o completezi" },
  { href: "/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate", h: "Verificarea PRAM: ce este și cât de des se face" },
  { href: "/blog/priza-de-pamant-valori-masurare", h: "Priza de pământ: valori și cum se măsoară" },
  { href: "/blog/autorizatie-anre-electrician", h: "Autorizația ANRE pentru electricieni" },
  { href: "/blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti", h: "Verificare și revizie gaze: când se face, ce pregătești" },
  { href: "/blog/fisa-evidenta-verificare-revizie-gaze-scadentar", h: "Fișa de evidență gaze și scadențarul pe bloc" },
  { href: "/blog/proces-verbal-punere-in-functiune-fotovoltaic-model", h: "Proces-verbal de punere în funcțiune fotovoltaic" },
  { href: "/blog/model-proces-verbal-raport-lucrare", h: "Model de proces-verbal de recepție și predare-primire" },
  { href: "/blog/dosar-prosumator-etape-termene-atr", h: "Dosarul de prosumator: pași, acte și termene ATR" },
  { href: "/blog/evidenta-orelor-tehnicieni-teren-pontaj", h: "Pontajul tehnicienilor din teren" },
  { href: "/blog/calculator-tarif-ora-electrician-instalator", h: "Calculator: tariful minim pe oră" },
  { href: "/blog/e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice", h: "e-Factura B2B pentru firmele de instalații" },
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
          iar tu vezi pe loc ce s-a lucrat, ce s-a consumat și ce e de facturat. Alegi domeniile în care lucrează firma, iar fiecare meserie are în plus formularele și documentele ei.
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
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p><RichText text={f.a} /></p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

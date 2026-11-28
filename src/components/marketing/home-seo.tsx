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
    more: "Software pentru firme de instalații electrice",
  },
  {
    href: "/firme-gaze-verificari-revizii",
    h: "Verificări și revizii gaze",
    p: "Scadențar pe bloc, scară și apartament, fișa de evidență completată și semnată pe telefon, termenele de după fișă și registrul anual.",
    more: "Program pentru verificări și revizii gaze",
  },
  {
    href: "/firme-fotovoltaice",
    h: "Montaj fotovoltaic",
    p: "Dosar pe etape, de la contract și montaj la ATR și AFM, ceas pentru termenele operatorului și fișa de punere în funcțiune pe fiecare string.",
    more: "Program pentru firme fotovoltaice",
  },
];
const FEATURES = [
  { href: "/aplicatie-tehnician", h: "Aplicația pentru tehnicieni din teren" },
  { href: "/pontaj-tehnicieni", h: "Pontaj online pe lucrare" },
  { href: "/foaie-de-parcurs-electronica", h: "Foaie de parcurs electronică" },
  { href: "/stoc-materiale-pe-masini", h: "Stoc de materiale pe mașini" },
  { href: "/facturare-smartbill-oblio", h: "Facturare din lucrări, prin SmartBill sau Oblio" },
  { href: "/software-management-echipe-teren", h: "Cum alegi un software pentru echipe de teren" },
  { href: "/despre", h: "Despre ElectroField" },
];
const GUIDES = [
  { href: "/blog/model-foaie-de-parcurs", h: "Model de foaie de parcurs și cum o completezi" },
  { href: "/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate", h: "Verificarea PRAM: ce este și cât de des se face" },
  { href: "/blog/priza-de-pamant-valori-masurare", h: "Priza de pământ: valori și cum se măsoară" },
  { href: "/blog/autorizatie-anre-electrician", h: "Autorizația ANRE pentru electricieni" },
  { href: "/blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti", h: "Verificare și revizie gaze: când se face, ce pregătești" },
  { href: "/blog/fisa-evidenta-verificare-revizie-gaze-scadentar", h: "Fișa de evidență gaze și scadențarul pe bloc" },
  { href: "/blog/proces-verbal-punere-in-functiune-fotovoltaic-model", h: "Proces-verbal de punere în funcțiune fotovoltaic" },
  { href: "/blog/evidenta-orelor-tehnicieni-teren-pontaj", h: "Pontajul tehnicienilor din teren" },
  { href: "/blog/calculator-tarif-ora-electrician-instalator", h: "Calculator: tariful minim pe oră" },
  { href: "/blog/e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice", h: "e-Factura B2B pentru firmele de instalații" },
];

/**
 * Imediat sub hero: pentru cine e programul, pe meserii, și legătura spre ghidul despre software-ul pentru
 * echipe de teren. Fără animații, vizibil și fără JavaScript.
 */
export function HomeIntro() {
  return (
    <section id="pentru-cine" className={s.intro} aria-labelledby="pentru-cine-title">
      <div className={s.wrap}>
        <div className={s.eyebrow}>Pentru cine e</div>
        <h2 id="pentru-cine-title" className={s.disp}>Program pentru firme de instalații electrice, gaze și fotovoltaice</h2>
        <p className={s.seoLead}>
          Alegi domeniile în care lucrează firma, iar meniul arată doar ce folosești. Partea comună e aceeași pentru toți:
          lucrări, echipe, pontaj, stoc pe mașini și facturare. Fiecare meserie are în plus formularele și documentele ei.
        </p>
        <div className={s.seoGrid}>
          {TRADES.map((t) => (
            <Link key={t.href} href={t.href} className={s.seoCard}>
              <h3>{t.h}</h3>
              <p>{t.p}</p>
              <span>{t.more} →</span>
            </Link>
          ))}
        </div>
        <p className={s.introMore}>
          Compari mai multe programe? Citește ghidul despre{" "}
          <Link href="/software-management-echipe-teren">ce face un software de management pentru echipe de teren și cum îl alegi</Link>.
        </p>
      </div>
    </section>
  );
}

/**
 * Spre finalul paginii: paginile de funcții, ghidurile și întrebările frecvente. Fără animații, ca Google
 * și cititorul să le vadă din prima.
 */
export function HomeSeo() {
  return (
    <section id="ghiduri" className={s.seo} aria-labelledby="functii-title">
      <div className={s.wrap}>
        <h2 id="functii-title" className={s.disp}>Ce face software-ul pentru echipele de teren</h2>
        <p className={s.seoLead}>
          Programezi lucrările pe echipe și zile, tehnicianul le face din telefon, iar orele, materialele, pozele și documentele
          rămân pe lucrare. Fiecare parte a platformei are pagina ei, cu ce face și ce nu face.
        </p>
        <ul className={s.seoPills}>
          {FEATURES.map((f) => <li key={f.href}><Link href={f.href}>{f.h}</Link></li>)}
        </ul>

        <h2 className={s.disp}>Ghiduri pentru firmele de instalații</h2>
        <ul className={s.seoGuides}>
          {GUIDES.map((g) => <li key={g.href}><StaticLink href={g.href}>{g.h}</StaticLink></li>)}
          <li><StaticLink href="/blog">Toate ghidurile pentru firme de instalații →</StaticLink></li>
        </ul>

        <h2 id="intrebari" className={s.disp}>Întrebări frecvente despre ElectroField</h2>
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

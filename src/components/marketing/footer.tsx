import { StaticLink } from "@/components/static-link";
import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL, LEGAL_SHORT } from "@/lib/contact";
import { BrandLogo } from "./brand";
import s from "./marketing.module.css";

// Subsolul paginii principale: toate paginile publice, pe grupe, plus ghidurile principale.
// /blog… și /programare sunt fișiere statice (StaticLink); restul sunt pagini Next (Link).
const PLATFORM = [
  { href: "/software-management-echipe-teren", label: "Software de management pentru echipe de teren" },
  { href: "/aplicatie-tehnician", label: "Aplicația pentru tehnicieni" },
  { href: "/pontaj-tehnicieni", label: "Pontaj online pentru tehnicieni" },
  { href: "/foaie-de-parcurs-electronica", label: "Foaie de parcurs electronică" },
  { href: "/stoc-materiale-pe-masini", label: "Stoc de materiale pe mașini" },
  { href: "/facturare-smartbill-oblio", label: "Facturare prin SmartBill și Oblio" },
];
const TRADES = [
  { href: "/firme-instalatii-electrice", label: "Firme de instalații electrice" },
  { href: "/firme-gaze-verificari-revizii", label: "Verificări și revizii gaze" },
  { href: "/firme-fotovoltaice", label: "Firme de montaj fotovoltaic" },
];
const GUIDES = [
  { href: "/blog/model-foaie-de-parcurs", label: "Model de foaie de parcurs" },
  { href: "/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate", label: "Verificarea PRAM: cât de des" },
  { href: "/blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti", label: "Verificare și revizie gaze" },
  { href: "/blog", label: "Toate ghidurile" },
];

export function MarketingFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div className={s.footGrid}>
          <div className={s.footBrand}>
            <Link href="/" className={s.brand}>
              <BrandLogo size={26} />
            </Link>
            <p>Program pentru firme de instalații electrice, gaze și fotovoltaice cu echipe în teren.</p>
          </div>
          <nav className={s.footCol} aria-label="Platforma">
            <p className={s.footHead}>Platforma</p>
            <ul>
              {PLATFORM.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
            </ul>
          </nav>
          <nav className={s.footCol} aria-label="Pe meserii">
            <p className={s.footHead}>Pe meserii</p>
            <ul>
              {TRADES.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
            </ul>
            <p className={s.footHead}>Ghiduri</p>
            <ul>
              {GUIDES.map((l) => <li key={l.href}><StaticLink href={l.href}>{l.label}</StaticLink></li>)}
            </ul>
          </nav>
          <nav className={s.footCol} aria-label="ElectroField">
            <p className={s.footHead}>ElectroField</p>
            <ul>
              <li><Link href="/despre">Despre ElectroField</Link></li>
              <li><StaticLink href="/programare">Programează o discuție</StaticLink></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
              <li><a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp {CONTACT_PHONE_DISPLAY}</a></li>
              <li><Link href="/termeni">Termeni și condiții</Link></li>
              <li><Link href="/confidentialitate">Confidențialitate</Link></li>
              <li><Link href="/login">Conectează-te</Link></li>
            </ul>
          </nav>
        </div>
        <div className={s.footCopy}>© {new Date().getFullYear()} ElectroField · {LEGAL_SHORT}</div>
      </div>
    </footer>
  );
}

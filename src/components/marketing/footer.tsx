import { StaticLink } from "@/components/static-link";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LEGAL_SHORT } from "@/lib/contact";
import s from "./marketing.module.css";

export function MarketingFooter() {
  return (
    <footer className={s.footer}>
      <div className={`${s.wrap} ${s.footRow}`}>
        <div className={s.brand}>
          <Logo size={26} />
        </div>
        <div className={s.footLinks}>
          <a href="#platforma">Platformă</a>
          <a href="#functionalitati">Funcționalități</a>
          <a href="#cum-functioneaza">Cum funcționează</a>
          <Link href="/software-management-echipe-teren">Software pentru echipe de teren</Link>
          <Link href="/firme-instalatii-electrice">Firme de instalații electrice</Link>
          <Link href="/firme-gaze-verificari-revizii">Verificări și revizii gaze</Link>
          <Link href="/firme-fotovoltaice">Firme fotovoltaice</Link>
          <Link href="/aplicatie-tehnician">Aplicația tehnicianului</Link>
          <Link href="/pontaj-tehnicieni">Pontaj tehnicieni</Link>
          <Link href="/foaie-de-parcurs-electronica">Foaie de parcurs</Link>
          <Link href="/stoc-materiale-pe-masini">Stoc pe mașini</Link>
          <Link href="/facturare-smartbill-oblio">Facturare SmartBill și Oblio</Link>
          <StaticLink href="/blog">Ghiduri pentru firme de instalații</StaticLink>
          <StaticLink href="/programare">Programează o discuție</StaticLink>
          <a href="https://wa.me/40750425670" target="_blank" rel="noopener noreferrer">WhatsApp 0750 425 670</a>
          <Link href="/termeni">Termeni și condiții</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
          <Link href="/login">Conectează-te</Link>
        </div>
        <div className={s.footCopy}>© {new Date().getFullYear()} ElectroField · {LEGAL_SHORT}</div>
      </div>
    </footer>
  );
}

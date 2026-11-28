import type { Metadata } from "next";
import Link from "next/link";
import { StaticLink } from "@/components/static-link";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, LEGAL_SHORT } from "@/lib/contact";
// Aceeași temă ca paginile publice pe meserie (întunecat, lime).
import s from "./[slug]/site-page.module.css";

// Pagina de 404 pentru adresele care nu există și pentru notFound() din orice rută. Next o afișează în
// layout-ul rădăcină, cu statusul 404; nu intră în căutări.
export const metadata: Metadata = {
  title: "Pagina nu există | ElectroField",
  description: "Adresa deschisă nu duce la nicio pagină ElectroField.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className={s.site}>
      <header className={s.top}>
        <div className={`${s.wrap} ${s.nav}`}>
          <Link className={s.logo} href="/" aria-label="ElectroField">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={26} height={26} />
            ElectroField
          </Link>
          <StaticLink className={s.l} href="/blog">Blog</StaticLink>
          {/* /start trimite fiecare cont în panoul lui; fără cont, la autentificare. */}
          <StaticLink className={`${s.btn} ${s.ghost} ${s.h}`} href="/start">Intră în cont</StaticLink>
          <StaticLink className={s.btn} href="/programare">Programează un demo</StaticLink>
        </div>
      </header>

      <main className={s.art}>
        <p className={s.kicker}>Eroare 404</p>
        <h1>Pagina nu există</h1>
        <p className={s.lead}>Adresa pe care ai deschis-o nu duce la nicio pagină. Poate a fost scrisă greșit sau pagina s-a mutat.</p>
        <p>De aici poți merge mai departe:</p>
        <ul className={s.related}>
          <li><Link href="/">Prima pagină ElectroField</Link></li>
          <li><Link href="/software-management-echipe-teren">Software de management pentru echipe de teren</Link></li>
          <li><StaticLink href="/blog">Blogul: ghiduri pentru firme de instalații</StaticLink></li>
          <li><StaticLink href="/programare">Programează o discuție despre platformă</StaticLink></li>
        </ul>
        <p>Ai cont în platformă? <StaticLink href="/start">Intră în cont</StaticLink> și continuă de unde ai rămas.</p>
      </main>

      <footer className={s.foot}>
        <div className={s.wrap}>
          <Link href="/">Acasă</Link><StaticLink href="/blog">Blog</StaticLink><StaticLink href="/programare">Programează un demo</StaticLink>
          <Link href="/termeni">Termeni</Link><Link href="/confidentialitate">Confidențialitate</Link>
          <p>© 2026 ElectroField · {LEGAL_SHORT} · {CONTACT_EMAIL} · {CONTACT_PHONE_DISPLAY}</p>
        </div>
      </footer>
    </div>
  );
}

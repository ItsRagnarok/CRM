"use client";

import { StaticLink } from "@/components/static-link";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./brand";
import s from "./marketing.module.css";

// Ancorele din pagină și paginile separate. /blog și /programare sunt fișiere statice (StaticLink).
const LINKS: { href: string; label: string; kind: "anchor" | "page" | "static" }[] = [
  { href: "#platforma", label: "Platformă", kind: "anchor" },
  { href: "#functionalitati", label: "Funcționalități", kind: "anchor" },
  { href: "#pentru-cine", label: "Pentru cine", kind: "anchor" },
  { href: "/blog", label: "Ghiduri", kind: "static" },
  { href: "/despre", label: "Despre", kind: "page" },
  { href: "#contact", label: "Contact", kind: "anchor" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`} aria-label="Meniu principal">
      <a href="#acasa" className={s.brand}>
        <BrandLogo size={30} priority />
      </a>
      <div className={s.navLinks}>
        {LINKS.map((l) =>
          l.kind === "page" ? (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ) : l.kind === "static" ? (
            <StaticLink key={l.href} href={l.href}>{l.label}</StaticLink>
          ) : (
            <a key={l.href} href={l.href}>{l.label}</a>
          )
        )}
      </div>
      <div className={s.navRight}>
        <Link href="/login" className={s.btnGhostNav}>
          Conectează-te
        </Link>
        {/* Pe ecrane înguste încape doar eticheta scurtă lângă siglă. */}
        <StaticLink href="/programare" className={s.btnLime}>
          <span className={s.ctaFull}>Programează o discuție</span>
          <span className={s.ctaShort}>Programare</span>
        </StaticLink>
      </div>
    </nav>
  );
}

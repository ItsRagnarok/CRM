"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import s from "./marketing.module.css";

const LINKS = [
  { href: "#acasa", label: "Acasă" },
  { href: "#platforma", label: "Platformă" },
  { href: "#functionalitati", label: "Funcționalități" },
  { href: "#cum-functioneaza", label: "Cum funcționează" },
  { href: "#preturi", label: "Prețuri" },
  { href: "#contact", label: "Contact" },
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
    <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
      <a href="#acasa" className={s.brand}>
        <Zap size={18} className={s.brandBolt} strokeWidth={2.5} fill="currentColor" />
        ElectroField
      </a>
      <div className={s.navLinks}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>
      <div className={s.navRight}>
        <Link href="/login" className={s.btnGhostNav}>
          Conectează-te
        </Link>
        <a href="#contact" className={s.btnLime}>
          Începe acum
        </a>
      </div>
    </nav>
  );
}

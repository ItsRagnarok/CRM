import Image from "next/image";
import { ArrowRight } from "lucide-react";
import s from "./marketing.module.css";

const STATS = [
  ["500", "+", "Firme active"],
  ["12.000", "+", "Tehnicieni în teren"],
  ["98", "%", "Rată de satisfacție"],
] as const;

export function CtaSection() {
  return (
    <section id="contact" className={s.ctaSection}>
      <div className={s.ctaBg}>
        <Image src="/marketing/city-night.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className={s.ctaScrim} />
      <div className={`${s.wrap} ${s.ctaContent}`}>
        <h2 className={s.disp}>
          Ești gata să ai control <span className={s.lime}>asupra întregii echipe?</span>
        </h2>
        <p>ElectroField — platforma pentru firmele care lucrează în teren.</p>
        <div className={s.heroCtas} style={{ justifyContent: "center" }}>
          <a href="mailto:contact@electrofield.ro" className={`${s.btn} ${s.btnPrimary}`}>
            Începe acum <ArrowRight size={17} />
          </a>
        </div>
        <div className={s.ctaStats}>
          {STATS.map(([v, u, l]) => (
            <div key={l} className={s.ctaStat}>
              <div className="v">
                {v}
                <span className="u">{u}</span>
              </div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

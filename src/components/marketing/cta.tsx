import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL } from "@/lib/contact";
import s from "./marketing.module.css";

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
          <a href="/programare" className={`${s.btn} ${s.btnPrimary}`}>
            Programează un demo <ArrowRight size={17} />
          </a>
          <a href="/blog" className={`${s.btn} ${s.btnOutline}`}>
            Citește ghidurile
          </a>
        </div>
        <p className={s.ctaMail}>
          Preferi email sau WhatsApp?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{" "}
          <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp {CONTACT_PHONE_DISPLAY}</a>
        </p>
      </div>
    </section>
  );
}

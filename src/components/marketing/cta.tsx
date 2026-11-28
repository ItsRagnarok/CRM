import { StaticLink } from "@/components/static-link";
import Image from "next/image";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL, CONTACT_WHATSAPP_URL } from "@/lib/contact";
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
          Vezi cum arată platforma <span className={s.lime}>pe firma ta.</span>
        </h2>
        <p>Îți arătăm platforma pe lucrările și echipele tale, într-un apel de 15 minute sau o prezentare de 30 de minute pe Google Meet.</p>
        <div className={s.heroCtas} style={{ justifyContent: "center" }}>
          <StaticLink href="/programare" className={`${s.btn} ${s.btnPrimary}`}>
            Programează o discuție <ArrowRight size={17} aria-hidden="true" />
          </StaticLink>
          <StaticLink href="/blog" className={`${s.btn} ${s.btnOutline}`}>
            Citește ghidurile pentru firme de instalații
          </StaticLink>
        </div>
        <div className={s.ctaContact}>
          <p>Preferi e-mail sau WhatsApp?</p>
          <ul>
            <li><Mail size={16} aria-hidden="true" /><span>E-mail</span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
            <li><MessageCircle size={16} aria-hidden="true" /><span>WhatsApp</span><a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{CONTACT_PHONE_DISPLAY}</a></li>
            <li><Phone size={16} aria-hidden="true" /><span>Telefon</span><a href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE_DISPLAY}</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

"use client";

import { StaticLink } from "@/components/static-link";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import gsap from "gsap";
import s from "./marketing.module.css";

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Titlul (h1) nu se animă: e vizibil din prima, ca Google și cititorul să-l vadă imediat (LCP).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".mk-reveal-3"],
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 }
      );

      const onScroll = () => {
        const y = window.scrollY;
        if (bgRef.current) bgRef.current.style.transform = `translateY(${y * 0.18}px) scale(1.04)`;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="acasa" className={s.hero}>
      <div className={s.heroBg} ref={bgRef}>
        <Image
          src="/marketing/van-dusk.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className={s.heroScrim} />

      <div className={`${s.wrap} ${s.heroGrid}`}>
        <div>
          <h1 className={`${s.heroKicker} mk-reveal-1`}>
            <span className={s.dot} />
            Software de management pentru electricieni și echipe de teren
          </h1>
          <p className={`${s.heroTitle} ${s.disp} mk-reveal-2`}>
            Din birou.
            <br />
            <span className={s.lime}>Direct în teren.</span>
          </p>
          <p className={`${s.heroSub} mk-reveal-3`}>
            ElectroField e programul prin care firmele de instalații electrice, gaze și fotovoltaice își programează lucrările,
            își urmăresc echipele mobile și facturează. Tehnicienii lucrează din aplicația de pe telefon: poze, pontaj, semnătura clientului.
          </p>
          <div className={`${s.heroCtas} mk-reveal-3`}>
            <StaticLink href="/programare" className={`${s.btn} ${s.btnPrimary}`}>
              Programează un demo <ArrowRight size={17} />
            </StaticLink>
            <a href="#cum-functioneaza" className={`${s.btn} ${s.btnOutline}`}>
              <PlayCircle size={17} />
              Vezi cum funcționează
            </a>
          </div>
        </div>

        <figure className={s.realPhone}>
          <Image src="/marketing/phone-lucrari.webp" alt="Aplicația ElectroField pe telefonul tehnicianului: lucrările săptămânii cu ora, clientul, adresa și starea" width={640} height={1090} priority sizes="(min-width: 1040px) 320px, 70vw" />
        </figure>
      </div>

    </section>
  );
}

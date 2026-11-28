"use client";

import { StaticLink } from "@/components/static-link";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import gsap from "gsap";
import { PhoneFrame } from "./phone-frame";
import s from "./marketing.module.css";

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".mk-reveal-1", ".mk-reveal-2", ".mk-reveal-3"],
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.05 }
      );
      gsap.fromTo(
        phoneRef.current,
        { opacity: 0, y: 40, rotateY: -28 },
        { opacity: 1, y: 0, rotateY: -16, duration: 1.3, ease: "power3.out", delay: 0.3 }
      );

      const onScroll = () => {
        const y = window.scrollY;
        if (bgRef.current) bgRef.current.style.transform = `translateY(${y * 0.18}px) scale(1.04)`;
        if (phoneRef.current) {
          const rot = -16 + Math.min(y * 0.02, 10);
          phoneRef.current.style.transform = `rotateY(${rot}deg) rotateX(4deg) translateY(${Math.min(y * 0.08, 60)}px)`;
        }
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

        <div className={s.phoneStage}>
          <div className={s.heroPhone} ref={phoneRef}>
            <PhoneFrame src="/marketing/phone-lucrari.webp" alt="Aplicația ElectroField pe telefonul tehnicianului: lucrările săptămânii cu ora, clientul, adresa și starea" priority sizes="(min-width: 1040px) 300px, 70vw" />
          </div>
        </div>
      </div>

      <div className={s.heroScrollCue} aria-hidden="true">
        <span className={s.ring} />
        <span className={s.lbl}>Scroll</span>
      </div>

    </section>
  );
}

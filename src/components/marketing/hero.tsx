"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import gsap from "gsap";
import s from "./marketing.module.css";

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".mk-reveal-1", ".mk-reveal-2", ".mk-reveal-3"],
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 }
      );
      gsap.fromTo(
        phoneRef.current,
        { opacity: 0, y: 40, rotateY: -28 },
        { opacity: 1, y: 0, rotateY: -16, duration: 1.3, ease: "power3.out", delay: 0.35 }
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
          <span className={`${s.heroKicker} mk-reveal-1`}>
            <span className={s.dot} />
            Platformă pentru firme de teren
          </span>
          <h1 className={`${s.heroTitle} ${s.disp} mk-reveal-2`}>
            Echipa ta.
            <br />
            În teren.
            <br />
            <span className={s.lime}>Sub control.</span>
          </h1>
          <p className={`${s.heroSub} mk-reveal-3`}>
            ElectroField îți oferă control în timp real asupra echipei, lucrărilor, clienților
            și întregului flux operațional.
          </p>
          <div className={`${s.heroCtas} mk-reveal-3`}>
            <a href="#contact" className={`${s.btn} ${s.btnPrimary}`}>
              Începe acum <ArrowRight size={17} />
            </a>
            <a href="#cum-functioneaza" className={`${s.btn} ${s.btnOutline}`}>
              <PlayCircle size={17} />
              Vezi cum funcționează
            </a>
          </div>
        </div>

        <div className={s.phoneStage}>
          <div className={s.phone3d} ref={phoneRef}>
            <div className={s.phoneNotch} />
            <div className={s.phoneScreen}>
              <div className={s.phoneStatusBar}>
                <span>9:41</span>
                <span>●●●</span>
              </div>
              <div className={s.phoneTitle}>Lucrările mele</div>
              <div className={s.phoneList}>
                <div className={s.phoneListRow}>
                  <div className={s.phoneAvatar}>AP</div>
                  <div className={s.phoneListText}>
                    <div className={s.phoneListName}>#2487 Casa Popescu</div>
                    <div className={s.phoneListRole}>Instalație electrică</div>
                  </div>
                  <span className={s.phoneBadge}>În curs</span>
                </div>
                <div className={s.phoneListRow}>
                  <div className={s.phoneAvatar}>MI</div>
                  <div className={s.phoneListText}>
                    <div className={s.phoneListName}>#2488 Birou Centru</div>
                    <div className={s.phoneListRole}>Verificare tablou</div>
                  </div>
                  <span className={s.phoneBadge}>Programat</span>
                </div>
              </div>
              <div className={s.phoneMapArea}>
                <span className={s.phonePin} style={{ top: "38%", left: "32%" }} />
                <span className={`${s.phonePin} ${s.cyan}`} style={{ top: "62%", left: "68%" }} />
              </div>
              <div className={s.phoneTabbar}>
                <span className={`${s.phoneTab} ${s.on}`}>Lucrări</span>
                <span className={s.phoneTab}>Hartă</span>
                <span className={s.phoneTab}>Profil</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.heroScrollCue}>
        <span className={s.ring} />
        <span className={s.lbl}>Scroll</span>
      </div>
    </section>
  );
}

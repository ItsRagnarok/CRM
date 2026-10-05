"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import s from "./marketing.module.css";

const STEPS = [
  "Programare",
  "Tehnician alocat",
  "Plecare",
  "Navigație",
  "Sosire",
  "Execuție",
  "Finalizare",
];

export function SceneJobJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.8 - rect.top) / (rect.height * 0.7);
      setFill(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeIdx = Math.floor(fill * STEPS.length);

  return (
    <section id="cum-functioneaza" className={`${s.section} ${s.journeySection}`} ref={ref}>
      <div className={s.journeyBg}>
        <Image src="/marketing/pylons.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className={s.journeyBgScrim} />
      <div className={s.wrap}>
        <div className={s.eyebrow}>O lucrare, de la A la Z</div>
        <div className={s.secHead}>
          <h2 className={s.disp}>
            De la prima programare
            <br />
            până la <span className={s.lime}>ultima factură.</span>
          </h2>
          <p>Fiecare etapă a unei lucrări, urmărită automat, fără hârtii și fără telefoane.</p>
        </div>

        <div className={s.journeyTrack}>
          <div className={s.journeyLine}>
            <div className={s.journeyLineFill} style={{ width: `${fill * 100}%` }} />
          </div>
          <div className={s.journeyGrid}>
            {STEPS.map((step, i) => (
              <div key={step} className={`${s.journeyStep} ${i <= activeIdx ? s.on : ""}`}>
                <div className={s.journeyDot}>{String(i + 1).padStart(2, "0")}</div>
                <div className={s.journeyLabel}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

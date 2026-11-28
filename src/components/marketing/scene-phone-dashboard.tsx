"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PhoneFrame } from "./phone-frame";
import s from "./marketing.module.css";

gsap.registerPlugin(ScrollTrigger);

// Aplicația tehnicianului, din capturi reale (cont de test Electrogaze), legată de derulare: telefonul
// trece prin ecrane, apoi lasă locul panoului din platformă.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const CAPTIONS = [
  { from: 0, to: 0.22, title: "Tehnicianul vede exact", lime: "ce are de făcut.", sub: "Lucrările zilei, în ordine: ora, clientul, adresa și starea fiecăreia." },
  { from: 0.22, to: 0.44, title: "Clientul și locația,", lime: "dintr-o privire.", sub: "Telefonul clientului și navigarea spre adresă, fără apeluri la birou." },
  { from: 0.44, to: 0.68, title: "Pașii lucrării,", lime: "bifați pe loc.", sub: "Pregătire, drum, pe loc, închidere: checklist, poze înainte și după, semnătura clientului." },
  { from: 0.68, to: 1.01, title: "Totul ajunge", lime: "la birou.", sub: "Ce face tehnicianul apare în platformă imediat ce telefonul are semnal, gata de facturat." },
];

export function ScenePhoneDashboard() {
  const stageRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
    });
    return () => trigger.kill();
  }, []);

  const screen2 = smooth(0.19, 0.25, progress);
  const screen3 = smooth(0.41, 0.47, progress);
  const dashIn = smooth(0.68, 0.88, progress);
  const phoneOut = smooth(0.7, 0.9, progress);

  return (
    <section id="aplicatie-dashboard" className={s.pdStage} ref={stageRef}>
      <div className={s.pdViewport}>
        <div className={s.pdIdx}>Aplicația tehnicianului → Platforma</div>

        <div className={s.pdLayer}>
          <div
            className={s.pdPhoneWrap}
            style={{
              transform: `translateX(${-phoneOut * 60}%) scale(${1 - phoneOut * 0.25}) rotateY(${-16 + progress * 10}deg) rotateX(4deg)`,
              opacity: 1 - phoneOut,
            }}
          >
            <PhoneFrame
              src="/marketing/phone-lucrari.webp"
              alt="Lista de lucrări a săptămânii în aplicația tehnicianului"
              sizes="280px"
              overlays={[
                { src: "/marketing/phone-lucrare.webp", alt: "Fișa unei lucrări: clientul, adresa și ce trebuie făcut", opacity: screen2 },
                { src: "/marketing/phone-finalizata.webp", alt: "Lucrare finalizată: toți pașii bifați, de la pregătire la închidere", opacity: screen3 },
              ]}
            />
          </div>

          <div
            className={s.pdDashWrap}
            style={{ opacity: dashIn, transform: `scale(${0.88 + dashIn * 0.12}) translateY(${(1 - dashIn) * 30}px)` }}
          >
            <figure className={s.pdShot}>
              <Image src="/marketing/screen-panou.webp" alt="Panoul din platformă: lucrările zilei, facturi restante și ce cere atenția acum" width={1400} height={640} sizes="(min-width: 1200px) 1120px, 92vw" />
            </figure>
          </div>
        </div>

        <div className={s.pdCaptions}>
          {CAPTIONS.map((c, i) => {
            const on = progress >= c.from && progress < c.to;
            const Tag = i === 0 ? "h2" : "h3";
            return (
              <div key={c.lime} className={s.pdCaption} style={{ opacity: on ? 1 : 0, transform: `translate(-50%, ${on ? 0 : 12}px)` }} aria-hidden={on ? undefined : true}>
                <Tag>
                  {c.title} <span className={s.lime}>{c.lime}</span>
                </Tag>
                <p>{c.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

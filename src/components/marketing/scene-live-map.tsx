"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import s from "./marketing.module.css";

const NODES = [
  { id: 1, x: 28, y: 32, color: "lime", name: "Andrei Popescu", status: "În deplasare", job: "Lucrare #2458" },
  { id: 2, x: 62, y: 22, color: "cyan", name: "Mihai Ionescu", status: "Pe locație", job: "Lucrare #2461" },
  { id: 3, x: 48, y: 58, color: "lime", name: "Vlad Georgescu", status: "Pe locație", job: "Lucrare #2463" },
  { id: 4, x: 78, y: 68, color: "cyan", name: "Andrei Popescu", status: "În deplasare", job: "Lucrare #2465" },
];

export function SceneLiveMap() {
  const [active, setActive] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setActive(1), 600);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="platforma" className={s.section} ref={sectionRef}>
      <div className={s.mapScene}>
        <div className={s.mapBg} />
        <svg className={s.mapRoutes} preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 28 32 Q 45 20 62 22" vectorEffect="non-scaling-stroke" />
          <path d="M 48 58 Q 62 60 78 68" vectorEffect="non-scaling-stroke" />
        </svg>
        {NODES.map((n) => (
          <button
            key={n.id}
            className={`${s.mapNode} ${n.color === "cyan" ? s.cyan : ""}`}
            style={{ top: `${n.y}%`, left: `${n.x}%` }}
            onMouseEnter={() => setActive(n.id)}
            onClick={() => setActive(n.id)}
            aria-label={n.name}
          />
        ))}
        {NODES.filter((n) => n.id === active).map((n) => (
          <div
            key={n.id}
            className={s.mapInfoCard}
            style={{ top: `calc(${n.y}% + 18px)`, left: `calc(${n.x}% + 18px)` }}
          >
            <div className={s.nm}>{n.name}</div>
            <div className={s.st}>{n.status}</div>
            <div className={s.jb}>{n.job}</div>
          </div>
        ))}

        <div className={s.mapPhotoCard}>
          <Image src="/marketing/technician-phone.jpg" alt="" width={190} height={130} />
          <div className={s.cap}>Tehnician verificând lucrarea, în teren</div>
        </div>

        <div className={`${s.wrap} ${s.mapCopy}`}>
          <div className={s.eyebrow}>Echipa în timp real</div>
          <div className={s.secHead}>
            <h2 className={s.disp}>
              Știi unde este echipa ta.
              <br />
              Știi ce face.
              <br />
              <span className={s.lime}>Știi ce urmează.</span>
            </h2>
            <p>
              Fiecare tehnician, fiecare echipă, fiecare lucrare — vizibile pe hartă, în timp
              real. Niciun apel telefonic ca să afli unde a ajuns echipa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

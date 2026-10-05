"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Users, UserCog, Package, Wallet, BarChart3, FileText } from "lucide-react";
import s from "./marketing.module.css";

const MODULES = [
  { id: "lucrari", icon: Briefcase, label: "Lucrări", desc: "Programări, status, istoric.", x: 50, y: 6 },
  { id: "client", icon: Users, label: "Client", desc: "Date, locație, contact.", x: 90, y: 24 },
  { id: "echipa", icon: UserCog, label: "Echipă", desc: "Tehnicieni, echipe, locație live.", x: 95, y: 64 },
  { id: "materiale", icon: Package, label: "Materiale", desc: "Stoc, depozit, consum.", x: 68, y: 94 },
  { id: "financiar", icon: Wallet, label: "Financiar", desc: "Facturi, venituri, costuri.", x: 24, y: 94 },
  { id: "rapoarte", icon: BarChart3, label: "Rapoarte", desc: "Performanță, activitate.", x: 3, y: 64 },
  { id: "documente", icon: FileText, label: "Documente", desc: "Fotografii, checklist-uri, semnături.", x: 7, y: 24 },
];

export function SceneModules() {
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hoveredRef = useRef(false);

  useEffect(() => {
    if (!revealed) return;
    let i = 0;
    const interval = setInterval(() => {
      if (hoveredRef.current) return;
      setActive(MODULES[i % MODULES.length].id);
      i += 1;
    }, 1600);
    return () => clearInterval(interval);
  }, [revealed]);

  return (
    <section id="functionalitati" className={s.section}>
      <div className={s.wrap}>
        <div className={s.eyebrow}>Totul într-un singur loc</div>
        <div className={s.secHead}>
          <h2 className={s.disp}>
            Un singur sistem.
            <br />
            <span className={s.lime}>Întregul tău business.</span>
          </h2>
          <p>Lucrări, clienți, echipă, materiale, financiar, rapoarte și documente — conectate într-un singur nucleu. Treci cu mouse-ul peste fiecare modul.</p>
        </div>

        <div className={`${s.modulesWrap} ${active ? s.active : ""}`} ref={wrapRef}>
          <div className={s.moduleRing} />
          <div className={s.moduleRing2} />

          <svg className={s.moduleLinesSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            {MODULES.map((m) => (
              <path
                key={m.id}
                className={`${s.moduleLine} ${active === m.id ? s.active : ""}`}
                d={`M 50 50 Q ${(50 + m.x) / 2} ${(50 + m.y) / 2 + (m.y < 50 ? -8 : 8)} ${m.x} ${m.y}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className={s.moduleCore}>
            Electro
            <br />
            Field
          </div>

          <div className={s.moduleOrbit}>
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className={`${s.moduleItem} ${revealed ? s.revealed : ""} ${active === m.id ? s.on : ""}`}
                  style={{ top: `${m.y}%`, left: `${m.x}%`, transitionDelay: `${i * 70}ms` }}
                  onMouseEnter={() => {
                    hoveredRef.current = true;
                    setActive(m.id);
                  }}
                  onMouseLeave={() => {
                    hoveredRef.current = false;
                  }}
                  onClick={() => setActive((cur) => (cur === m.id ? null : m.id))}
                >
                  <div className={s.moduleCard} style={{ animationDelay: `${i * 0.4}s` }}>
                    <Icon size={18} />
                    <span className="t">{m.label}</span>
                    <div className={s.moduleDesc}>{m.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Briefcase, Users, UserCog, Package, Wallet, BarChart3, FileText } from "lucide-react";
import s from "./marketing.module.css";

const MODULES = [
  { icon: Briefcase, label: "Lucrări", x: 50, y: 6 },
  { icon: Users, label: "Client", x: 90, y: 24 },
  { icon: UserCog, label: "Echipă", x: 95, y: 64 },
  { icon: Package, label: "Materiale", x: 68, y: 94 },
  { icon: Wallet, label: "Financiar", x: 24, y: 94 },
  { icon: BarChart3, label: "Rapoarte", x: 3, y: 64 },
  { icon: FileText, label: "Documente", x: 7, y: 24 },
];

export function SceneModules() {
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
          <p>Lucrări, clienți, echipă, materiale, financiar, rapoarte și documente — conectate într-un singur nucleu.</p>
        </div>

        <div className={s.modulesWrap}>
          <div className={s.moduleOrbit}>
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className={s.moduleItem}
                  style={{
                    top: `${m.y}%`,
                    left: `${m.x}%`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  <Icon size={18} />
                  <span className="t">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className={s.moduleCore}>
            Electro
            <br />
            Field
          </div>
        </div>
      </div>
    </section>
  );
}

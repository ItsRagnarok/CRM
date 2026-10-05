"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, MapPin, Package, Camera, ClipboardCheck, PenLine } from "lucide-react";
import s from "./marketing.module.css";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const windowOpacity = (p: number, start: number, end: number, fade = 0.035) =>
  smooth(start, start + fade, p) * (1 - smooth(end - fade, end, p));

const SCREENS = [
  { key: "lista", label: "Listă lucrări", win: [0, 0.17] as [number, number] },
  { key: "client", label: "Client & detalii", win: [0.15, 0.32] as [number, number] },
  { key: "materiale", label: "Materiale & navigație", win: [0.3, 0.47] as [number, number] },
  { key: "checklist", label: "Checklist & finalizare", win: [0.45, 0.64] as [number, number] },
];

const CAPTIONS = [
  { win: [0, 0.17], title: "Tehnicianul vede exact ce are de făcut.", sub: "Lucrările zilei, prioritizate, cu toate detaliile necesare." },
  { win: [0.15, 0.32], title: "Clientul și locația, dintr-o privire.", sub: "Adresă, contact, istoric — fără telefoane către birou." },
  { win: [0.3, 0.47], title: "Materiale verificate înainte de drum.", sub: "Dacă lipsește ceva, tehnicianul merge la depozit, nu la fața locului." },
  { win: [0.45, 0.64], title: "Checklist, fotografii, semnătură client.", sub: "Lucrarea se finalizează complet, din teren." },
  { win: [0.68, 1], title: "Totul ajunge automat în platformă.", sub: "Firma vede, în timp real, tot ce se întâmplă pe teren." },
];

export function ScenePhoneDashboard() {
  const stageRef = useRef<HTMLDivElement>(null);
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

  const dashIn = smooth(0.7, 0.92, progress);
  const phoneOut = smooth(0.74, 0.94, progress);
  const activeCaption = CAPTIONS.find((c) => progress >= c.win[0] && progress < c.win[1]) ?? CAPTIONS[CAPTIONS.length - 1];

  return (
    <section id="aplicatie-dashboard" className={s.pdStage} ref={stageRef}>
      <div className={s.pdViewport}>
        <div className={s.pdIdx}>03 / APLICAȚIA TEHNICIANULUI → DASHBOARD</div>

        <div className={s.pdLayer}>
          <div
            className={s.pdPhoneWrap}
            style={{
              transform: `translateX(${-phoneOut * 60}%) scale(${1 - phoneOut * 0.25}) rotateY(${-16 + progress * 10}deg)`,
              opacity: 1 - phoneOut,
            }}
          >
            <div className={s.pdPhone}>
              <div className={s.pdPhoneScreen}>
                <PhonePanel opacity={windowOpacity(progress, ...SCREENS[0].win)}>
                  <PanelLista />
                </PhonePanel>
                <PhonePanel opacity={windowOpacity(progress, ...SCREENS[1].win)}>
                  <PanelClient />
                </PhonePanel>
                <PhonePanel opacity={windowOpacity(progress, ...SCREENS[2].win)}>
                  <PanelMateriale />
                </PhonePanel>
                <PhonePanel opacity={windowOpacity(progress, ...SCREENS[3].win)}>
                  <PanelChecklist progress={progress} win={SCREENS[3].win} />
                </PhonePanel>
              </div>
            </div>
          </div>

          <div
            className={s.pdDashWrap}
            style={{
              opacity: dashIn,
              transform: `scale(${0.88 + dashIn * 0.12}) translateY(${(1 - dashIn) * 30}px)`,
            }}
          >
            <Dashboard />
          </div>
        </div>

        <div className={s.pdCaption}>
          <h3>
            {activeCaption.title.split(" ").slice(0, -2).join(" ")}{" "}
            <span className={s.lime}>{activeCaption.title.split(" ").slice(-2).join(" ")}</span>
          </h3>
          <p>{activeCaption.sub}</p>
        </div>
      </div>
    </section>
  );
}

function PhonePanel({ opacity, children }: { opacity: number; children: React.ReactNode }) {
  return (
    <div className={s.pdScreenPanel} style={{ opacity, pointerEvents: "none" }}>
      {children}
    </div>
  );
}

function PanelLista() {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Lucrările mele</div>
      {[
        ["#2487 Casa Popescu", "Instalație electrică", "În curs"],
        ["#2488 Birou Centru", "Verificare tablou", "Programat"],
        ["#2490 Hală industrială", "Mentenanță", "Programat"],
      ].map(([t, sub, badge]) => (
        <div className={s.pdJobCard} key={t}>
          <div style={{ fontSize: 11.5, fontWeight: 700 }}>{t}</div>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", marginTop: 3 }}>{sub}</div>
          <div style={{ display: "inline-block", marginTop: 7, fontSize: 8.5, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "rgba(198,255,74,.15)", color: "var(--lime)" }}>
            {badge}
          </div>
        </div>
      ))}
    </>
  );
}

function PanelClient() {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Client & locație</div>
      <div className={s.pdJobCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700 }}>
          <MapPin size={14} color="#c6ff4a" /> Popescu Andreea
        </div>
        <div style={{ fontSize: 10.5, color: "var(--fg-mute)", marginTop: 6 }}>Str. Primăverii nr. 14, Cluj-Napoca</div>
        <div style={{ fontSize: 10.5, color: "var(--fg-mute)", marginTop: 3 }}>+40 744 xxx xxx</div>
      </div>
      <div className={s.pdJobCard}>
        <div style={{ fontSize: 10.5, color: "var(--fg-dim)" }}>Istoric: 3 lucrări finalizate</div>
      </div>
    </>
  );
}

function PanelMateriale() {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
        <Package size={14} color="#c6ff4a" /> Materiale necesare
      </div>
      {["Cablu CYABY 3x2.5 — 20m", "Disjunctor 16A — 2 buc", "Doză derivație — 4 buc"].map((m) => (
        <div key={m} className={`${s.pdChecklistRow} ${s.done}`} style={{ padding: "6px 0" }}>
          <span className={s.c}>
            <Check size={11} />
          </span>
          {m}
        </div>
      ))}
      <div className={s.pdJobCard} style={{ marginTop: 6 }}>
        <div style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>Navigație → 12 min până la locație</div>
      </div>
    </>
  );
}

function PanelChecklist({ progress, win }: { progress: number; win: [number, number] }) {
  const local = clamp((progress - win[0]) / (win[1] - win[0]));
  const items = ["Verificare siguranță", "Testare circuit", "Fotografii finale", "Semnătură client"];
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
        <ClipboardCheck size={14} color="#c6ff4a" /> Checklist finalizare
      </div>
      {items.map((it, i) => {
        const done = local > (i + 1) / (items.length + 1);
        return (
          <div key={it} className={`${s.pdChecklistRow} ${done ? s.done : ""}`}>
            <span className={s.c}>{done && <Check size={11} />}</span>
            {it}
          </div>
        );
      })}
      <div className={s.pdJobCard} style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <PenLine size={13} color="#c6ff4a" />
        <span style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>Semnătură client capturată</span>
      </div>
      <div className={s.pdJobCard} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Camera size={13} color="#c6ff4a" />
        <span style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>6 fotografii atașate</span>
      </div>
    </>
  );
}

function Dashboard() {
  const stats = [
    ["12", "Echipe active"],
    ["8", "Lucrări în desfășurare"],
    ["15", "Clienți astăzi"],
    ["24.800 lei", "Venituri lunare"],
  ];
  const jobs = [
    ["#2487", "Instalație electrică - Casa Popescu", "În curs"],
    ["#2481", "Verificare tablou - Birou Centru", "Finalizat"],
    ["#2475", "Mentenanță - Hală industrială", "Finalizat"],
  ];
  const team = [
    ["Andrei Popescu", "Instalator", "On locație"],
    ["Mihai Ionescu", "Electrician", "On locație"],
    ["Vlad Georgescu", "Tehnician", "On locație"],
  ];
  return (
    <div className={s.pdDash}>
      <div className={s.pdDashTop}>
        <strong style={{ fontSize: 13 }}>ElectroField — Dashboard</strong>
        <span style={{ fontSize: 10.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>Astăzi, 09:42</span>
      </div>
      <div className={s.pdDashStats}>
        {stats.map(([v, l]) => (
          <div key={l} className={s.pdDashStat}>
            <div className={s.v}>{v}</div>
            <div className={s.l}>{l}</div>
          </div>
        ))}
      </div>
      <div className={s.pdDashBody}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-mute)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Lucrări recente
          </div>
          {jobs.map(([id, t, st]) => (
            <div className={s.pdDashRow} key={id}>
              <span className={s.nm}>{id} {t}</span>
              <span className={s.st} style={{ background: st === "Finalizat" ? "rgba(95,224,232,.14)" : undefined, color: st === "Finalizat" ? "var(--cyan)" : undefined }}>{st}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-mute)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Activitate tehnicieni
          </div>
          {team.map(([nm, role, st]) => (
            <div className={s.pdDashRow} key={nm}>
              <span className={s.nm}>{nm} <span style={{ color: "var(--fg-mute)", fontWeight: 400 }}>· {role}</span></span>
              <span className={s.st}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

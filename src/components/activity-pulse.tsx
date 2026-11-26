"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bara de activitate din colțul de sus: utilizatori activi (bulină care pulsează) și viteza platformei.
 * „real” (firmele): oamenii conectați acum pe toată platforma și timpul măsurat de răspuns al serverului.
 * „simulat” (doar Super Admin, în vizualizarea unei companii): cifre după oră (09–18: 700–1.200; altfel 20–250).
 */
function hourInRomania() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}
/**
 * Ce arată bara la firme. Acum toate companiile sunt de test (create de Super Admin), deci rulează animația.
 * Înainte ca primul client real să primească un cont, se trece pe "real" (cifre reale, gata în cod).
 */
export const ACTIVITY_MODE: "real" | "simulat" = "simulat";

const band = (h: number): [number, number] => (h >= 9 && h < 18 ? [700, 1200] : [20, 250]);

export function ActivityPulse({ mode = "real" }: { mode?: "real" | "simulat" }) {
  const value = useRef<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [secs, setSecs] = useState(0.3);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    if (mode === "real") {
      // Cifre reale: câți oameni sunt conectați acum și cât durează, din browserul tău, răspunsul serverului.
      const poll = async () => {
        const t0 = performance.now();
        try {
          const res = await fetch("/api/activity", { cache: "no-store" });
          const ms = performance.now() - t0;
          if (res.ok && alive) {
            const j = (await res.json()) as { users?: number };
            setUsers(Math.max(1, Number(j.users ?? 1)));
            setSecs(ms / 1000);
          }
        } catch { /* fără rețea: păstrăm ultimele valori */ }
        if (alive) timer = setTimeout(poll, 30_000);
      };
      void poll();
      return () => { alive = false; clearTimeout(timer); };
    }
    const step = () => {
      const [lo, hi] = band(hourInRomania());
      let v = value.current ?? lo + Math.random() * (hi - lo);
      // Mers aleatoriu în interval; la schimbarea de tură (18:00 / 09:00) se apropie treptat.
      if (v > hi) v -= Math.max(15, (v - hi) * 0.25);
      else if (v < lo) v += Math.max(15, (lo - v) * 0.25);
      else v += (Math.random() - 0.5) * (hi - lo) * 0.08;
      v = Math.min(Math.max(v, 5), 1400);
      value.current = v;
      setUsers(Math.round(v));
      setSecs(0.18 + (v / 1200) * 0.4 + Math.random() * 0.06);
      timer = setTimeout(step, 2000 + Math.random() * 2000);
    };
    step();
    return () => { alive = false; clearTimeout(timer); };
  }, [mode]);

  if (users === null) return null;
  const level = secs < 0.35 ? 4 : secs < 0.5 ? 3 : 2;
  const label = level === 4 ? "Foarte rapidă" : level === 3 ? "Rapidă" : "Normală";
  const barColor = level === 2 ? "bg-[#f79009]" : "bg-[#12b76a]";

  return (
    <div className="flex items-center gap-1.5 md:gap-2" aria-label="Activitate platformă">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[12px] font-semibold text-muted md:gap-2 md:px-3 md:py-1.5 md:text-[13px]" title="Utilizatori conectați acum, pe web și pe telefon">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#12b76a] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#12b76a]" />
        </span>
        <strong className="min-w-[4ch] text-right text-[13.5px] font-extrabold tabular-nums text-foreground md:text-[15px]">{users.toLocaleString("ro-RO")}</strong>
        <span className="hidden sm:inline">utilizatori activi</span><span className="sm:hidden">activi</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[12px] font-semibold text-muted md:gap-2 md:px-3 md:py-1.5 md:text-[13px]" title="Timpul de răspuns al platformei">
        <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
          {[5, 8, 11, 14].map((h, i) => <i key={h} className={`w-[3px] rounded-[1px] ${i < level ? barColor : "bg-border"}`} style={{ height: h }} />)}
        </span>
        <span className="hidden lg:inline">{label} ·</span> <strong className="min-w-[5ch] font-extrabold tabular-nums text-foreground">{secs.toFixed(2).replace(".", ",")} s</strong>
      </span>
    </div>
  );
}

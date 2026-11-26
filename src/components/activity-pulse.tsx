"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bara de activitate din colțul de sus: utilizatori activi (bulină care pulsează) și viteza platformei.
 * Deocamdată cifrele sunt simulate după oră (09–18: 700–1.200; altfel 20–250), de aceea se arată doar
 * Super Adminului, în vizualizarea unei companii. Când se leagă de date reale, se poate arăta tuturor.
 */
function hourInRomania() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}
const band = (h: number): [number, number] => (h >= 9 && h < 18 ? [700, 1200] : [20, 250]);

export function ActivityPulse() {
  const value = useRef<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [secs, setSecs] = useState(0.3);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
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
    return () => clearTimeout(timer);
  }, []);

  if (users === null) return null;
  const level = secs < 0.35 ? 4 : secs < 0.5 ? 3 : 2;
  const label = level === 4 ? "Foarte rapidă" : level === 3 ? "Rapidă" : "Normală";
  const barColor = level === 2 ? "bg-[#f79009]" : "bg-[#12b76a]";

  return (
    <div className="hidden items-center gap-2 lg:flex" aria-label="Activitate platformă">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-semibold text-muted" title="Utilizatori conectați acum, pe web și pe telefon">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#12b76a] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#12b76a]" />
        </span>
        <strong className="min-w-[4ch] text-right text-[15px] font-extrabold tabular-nums text-foreground">{users.toLocaleString("ro-RO")}</strong>
        utilizatori activi
      </span>
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-semibold text-muted" title="Timpul de răspuns al platformei">
        <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
          {[5, 8, 11, 14].map((h, i) => <i key={h} className={`w-[3px] rounded-[1px] ${i < level ? barColor : "bg-border"}`} style={{ height: h }} />)}
        </span>
        {label} · <strong className="min-w-[5ch] font-extrabold tabular-nums text-foreground">{secs.toFixed(2).replace(".", ",")} s</strong>
      </span>
    </div>
  );
}

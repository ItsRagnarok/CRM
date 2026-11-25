"use client";

import { startTransition, useActionState, useState } from "react";
import { METRIC_IDS, METRICS, type MetricId, type MondayConfig } from "@/lib/monday";
import { saveMondayConfig } from "./actions";

const UNIT: Record<string, string> = { lei: "lei", "%": "%", lucrări: "lucrări", cereri: "cereri" };

export function ConfigForm({ config }: { config: MondayConfig }) {
  const [state, action, pending] = useActionState(saveMondayConfig, undefined);
  const [chosen, setChosen] = useState<MetricId[]>(config.metrics);
  const toggle = (id: MetricId, on: boolean) => setChosen((c) => (on ? [...c, id].slice(0, 3) : c.filter((x) => x !== id)));
  return (
    // Trimitere manuală: o acțiune de formular resetează câmpurile după salvare și bifele ar arăta alegerea veche.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-[13px] text-muted">Alege cel mult 3 cifre. Pune pragul de la care vrei să fii atenționat; lasă gol dacă vrei doar să vezi cifra. Lunea dimineața primești o notificare cu cifrele care au trecut de prag.</p>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {METRIC_IDS.map((id) => {
          const d = METRICS[id];
          const on = chosen.includes(id);
          const full = !on && chosen.length >= 3;
          return (
            <li key={id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3 ${full ? "opacity-55" : ""}`}>
              <label className="flex min-w-0 flex-1 items-center gap-2.5 text-[13.5px] font-semibold">
                <input type="checkbox" name="metric" value={id} checked={on} disabled={full} onChange={(e) => toggle(id, e.target.checked)} className="h-4 w-4 accent-[#1f2024]" />
                {d.label}
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-muted">
                Alertă {d.dir === "above" ? "peste" : "sub"}
                <input name={`t_${id}`} inputMode="numeric" defaultValue={config.thresholds[id] ?? ""} placeholder="fără prag" className="w-28 rounded-lg border border-border bg-white px-2.5 py-1.5 text-right text-[13px] tabular-nums text-foreground" />
                <span className="w-12">{UNIT[d.unit]}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending || chosen.length === 0} className="rounded-[10px] bg-electric px-4 py-2 text-[13px] font-extrabold disabled:opacity-50">{pending ? "Se salvează…" : "Salvează"}</button>
        <span className="text-[12.5px] text-muted">{chosen.length}/3 alese</span>
        {state?.error && <span role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</span>}
        {state?.ok && <span role="status" className="text-[12.5px] font-semibold text-success">Salvat.</span>}
      </div>
    </form>
  );
}

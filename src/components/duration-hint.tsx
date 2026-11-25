"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { addMinutes, estimateFor, formatMinutes, type DurationStat } from "@/lib/job-durations";

/**
 * Sub orele din formular: „De obicei durează …”, din pontajul lucrărilor de același tip.
 * Butonul pune ora de sfârșit după ora de start (biroul poate schimba oricând).
 */
export function DurationHint({ stats }: { stats: DurationStat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ title: string; start: string; end: string }>({ title: "", start: "", end: "" });

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const read = () => {
      const fd = new FormData(form);
      setState({ title: String(fd.get("title") ?? ""), start: String(fd.get("startTime") ?? ""), end: String(fd.get("endTime") ?? "") });
    };
    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    const mo = new MutationObserver(read);
    mo.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ["value"] });
    return () => {
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
      mo.disconnect();
    };
  }, []);

  const est = estimateFor(state.title, stats);
  const suggested = est && state.start ? addMinutes(state.start, est.medianMin) : null;

  function apply() {
    const form = ref.current?.closest("form");
    const input = form?.querySelector<HTMLInputElement>('input[name="endTime"]');
    if (!input || !suggested) return;
    // Setter-ul nativ + evenimentul „input”: funcționează și pe câmpurile controlate de React.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, suggested);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div ref={ref} aria-live="polite">
      {est && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] bg-electric-soft/60 px-3.5 py-2.5 text-[12.5px] text-foreground">
          <Timer className="h-4 w-4 shrink-0 text-electric" aria-hidden />
          <span className="flex-1">
            <b>{est.label}</b> durează de obicei <b>{formatMinutes(est.medianMin)}</b>
            {est.highMin > est.lowMin && <> (între {formatMinutes(est.lowMin)} și {formatMinutes(est.highMin)})</>}, din pontajul a {est.count} lucrări finalizate.
          </span>
          {suggested && suggested !== state.end.slice(0, 5) && (
            <button type="button" onClick={apply} className="shrink-0 rounded-[8px] bg-electric px-3 py-1.5 text-[12px] font-bold text-[#1f2024]">
              Pune sfârșitul la {suggested}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

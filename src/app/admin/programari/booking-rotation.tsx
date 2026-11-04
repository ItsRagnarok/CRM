"use client";

import { useState } from "react";

type Window = { from: string; to: string };
export type Rotation = { start: string; end: string; pattern: (Window | null)[] };

const DEFAULT_ROTATION: Rotation = {
  start: "2026-11-02",
  end: "2028-11-01",
  pattern: [null, { from: "10:00", to: "15:00" }, { from: "10:00", to: "19:00" }, { from: "10:00", to: "19:00" }],
};
const input = "rounded-lg border border-border bg-white px-3 py-2 text-sm";

export function BookingRotation({ saved, today, onApply }: {
  saved?: Rotation;
  today: string;
  onApply: (rotation: Rotation) => void;
}) {
  const [rotation, setRotation] = useState(saved ?? DEFAULT_ROTATION);

  function setDay(index: number, window: Window | null) {
    setRotation((previous) => ({ ...previous, pattern: previous.pattern.map((day, position) => position === index ? window : day) }));
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-5">
      <h2 className="text-lg font-bold">Program în rotație</h2>
      <p className="text-sm text-muted">Alege prima zi din ciclu. Cele patru zile se repetă până la data de final, inclusiv. Aplicarea înlocuiește disponibilitatea din interval, începând de azi, și închide programul săptămânal. Rezervările confirmate se păstrează.</p>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">Prima zi din ciclu
          <input type="date" className={input} value={rotation.start} onChange={(event) => setRotation({ ...rotation, start: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm">Ultima zi disponibilă în calendar
          <input type="date" className={input} min={rotation.start > today ? rotation.start : today} value={rotation.end} onChange={(event) => setRotation({ ...rotation, end: event.target.value })} />
        </label>
      </div>
      {rotation.pattern.map((day, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex w-40 items-center gap-2">
            <input type="checkbox" checked={day !== null} onChange={(event) => setDay(index, event.target.checked ? { from: "10:00", to: "19:00" } : null)} />
            Ziua {index + 1} · {day ? "disponibil" : "închis"}
          </label>
          {day && <>
            <input type="time" className={input} aria-label={`Ziua ${index + 1}, ora de început`} value={day.from} onChange={(event) => setDay(index, { ...day, from: event.target.value })} />
            <span>–</span>
            <input type="time" className={input} aria-label={`Ziua ${index + 1}, ora de final`} value={day.to} onChange={(event) => setDay(index, { ...day, to: event.target.value })} />
          </>}
        </div>
      ))}
      <button type="button" className="rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-white" onClick={() => {
        if (window.confirm("Înlocuiești disponibilitatea din perioada aleasă? Programările confirmate rămân în calendar.")) onApply(rotation);
      }}>Aplică rotația</button>
    </section>
  );
}

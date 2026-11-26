"use client";

import { useState } from "react";
import { DEMO_DEFAULT_DAYS, DEMO_DEFAULT_OPEN, DEMO_FEATURES, type DemoFeature } from "@/lib/demo";

const GROUPS: { title: string; items: DemoFeature[] }[] = [
  { title: "Platforma de birou (meniul din stânga)", items: DEMO_FEATURES.filter((f) => f.area !== "mobil") },
  { title: "Aplicația de telefon", items: DEMO_FEATURES.filter((f) => f.area === "mobil") },
];

/**
 * Câmpurile contului demo (în „Companie nouă” și pe pagina companiei): comutatorul, ce secțiuni și
 * subfuncții sunt deschise și până când ține demo-ul. Bifat = deschis; nebifat = apare cu lacăt.
 * O subfuncție e blocată și când secțiunea ei e blocată.
 */
export function DemoFields({ defaultDemo = false, defaultUnlocked, defaultExpires }: { defaultDemo?: boolean; defaultUnlocked?: string[]; defaultExpires?: string | null }) {
  const [demo, setDemo] = useState(defaultDemo);
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultUnlocked ?? DEMO_DEFAULT_OPEN));
  const initialDate = defaultExpires ? defaultExpires.slice(0, 10) : new Date(Date.now() + DEMO_DEFAULT_DAYS * 86_400_000).toISOString().slice(0, 10);
  const toggle = (id: string, on: boolean) => setOpen((prev) => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  const setAll = (on: boolean) => setOpen(on ? new Set(DEMO_FEATURES.map((f) => f.id)) : new Set());

  return (
    <div className="rounded-[12px] border border-[#e7e3f5] p-4">
      <label className="flex items-center gap-2.5 text-[14px] font-bold text-[#17151f]">
        <input type="checkbox" name="demo" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-[18px] w-[18px] accent-[#6d28d9]" />
        Cont demo
      </label>
      <p className="mt-1 text-[12.5px] text-[#5c5670]">
        Firma vede tot meniul. Ce debifezi apare cu lacăt și ecranul „se configurează pe firma ta”, cu „Programează o discuție” și „Cere ofertă”.
      </p>
      {demo && (
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="font-semibold text-[#5c5670]">Deschise: {open.size} din {DEMO_FEATURES.length}</span>
            <button type="button" onClick={() => setAll(true)} className="rounded-md border border-[#e7e3f5] px-2 py-1 font-semibold">Deschide tot</button>
            <button type="button" onClick={() => setAll(false)} className="rounded-md border border-[#e7e3f5] px-2 py-1 font-semibold">Blochează tot</button>
            <button type="button" onClick={() => setOpen(new Set(DEMO_DEFAULT_OPEN))} className="rounded-md border border-[#e7e3f5] px-2 py-1 font-semibold">Varianta recomandată</button>
          </div>
          {GROUPS.map((g) => (
            <fieldset key={g.title} className="flex flex-col gap-1">
              <legend className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-[#9b93b5]">{g.title}</legend>
              {g.items.filter((f) => !f.parent).map((f) => {
                const children = g.items.filter((c) => c.parent === f.id);
                const parentOn = open.has(f.id);
                return (
                  <div key={f.id} className="rounded-[9px] border border-[#f2f0f9] px-2.5 py-2">
                    <label className="flex items-center gap-2 text-[13.5px]">
                      <input type="checkbox" checked={parentOn} onChange={(e) => toggle(f.id, e.target.checked)} className="h-4 w-4" />
                      <span className="font-semibold text-[#17151f]">{f.label}</span>
                      {f.area === "ambele" && <span className="text-[11.5px] text-[#9b93b5]">platformă și telefon</span>}
                      {!parentOn && <span className="ml-auto text-[11.5px] font-semibold text-[#b42318]">cu lacăt</span>}
                    </label>
                    {children.length > 0 && (
                      <div className="mt-1.5 grid gap-1 pl-6 sm:grid-cols-2">
                        {children.map((c) => (
                          <label key={c.id} className={`flex items-center gap-2 text-[12.5px] ${parentOn ? "text-[#344054]" : "text-[#9b93b5]"}`}>
                            <input type="checkbox" checked={open.has(c.id)} disabled={!parentOn} onChange={(e) => toggle(c.id, e.target.checked)} className="h-3.5 w-3.5" />
                            {c.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </fieldset>
          ))}
          {[...open].map((id) => <input key={id} type="hidden" name="unlocked" value={id} />)}
          <p className="text-[11.5px] text-[#9b93b5]">Mereu deschise: Panoul și notificările; pe telefon, ziua de azi și pașii unei lucrări (poze, checklist, semnătură). O subfuncție bifată rămâne blocată cât timp secțiunea ei e blocată.</p>
          <label className="text-[12.5px] font-semibold text-[#5c5670]">Demo-ul ține până la
            <input type="date" name="demoExpires" defaultValue={initialDate} className="mt-1 block rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[14px]" />
            <span className="mt-1 block text-[11.5px] font-normal text-[#9b93b5]">După dată se blochează tot ce e mai sus, iar banda de sus devine roșie. Datele rămân. Gol = fără dată.</span>
          </label>
        </div>
      )}
    </div>
  );
}

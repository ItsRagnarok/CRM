"use client";

import { useState } from "react";
import { DEMO_DEFAULT_DAYS, DEMO_FEATURES } from "@/lib/demo";

const AREA: Record<string, string> = { web: "Platformă", mobil: "Telefon", ambele: "Platformă și telefon" };

/**
 * Câmpurile contului demo (în „Companie nouă” și pe pagina companiei): comutatorul, ce funcții
 * rămân deblocate și până când ține demo-ul. Bifat = deblocat; implicit toate sunt blocate.
 */
export function DemoFields({ defaultDemo = false, defaultUnlocked = [], defaultExpires }: { defaultDemo?: boolean; defaultUnlocked?: string[]; defaultExpires?: string | null }) {
  const [demo, setDemo] = useState(defaultDemo);
  const initialDate = defaultExpires ? defaultExpires.slice(0, 10) : new Date(Date.now() + DEMO_DEFAULT_DAYS * 86_400_000).toISOString().slice(0, 10);
  return (
    <div className="rounded-[12px] border border-[#e7e3f5] p-4">
      <label className="flex items-center gap-2.5 text-[14px] font-bold text-[#17151f]">
        <input type="checkbox" name="demo" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-[18px] w-[18px] accent-[#6d28d9]" />
        Cont demo
      </label>
      <p className="mt-1 text-[12.5px] text-[#5c5670]">
        Firma vede tot meniul. Funcțiile nebifate mai jos apar cu lacăt și ecranul „se configurează pe firma ta”, cu „Programează o discuție” și „Cere ofertă”. Sus apare „Cont demo · numele firmei”.
      </p>
      {demo && (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-[#9b93b5]">Deblocate în demo</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {DEMO_FEATURES.map((f) => (
                <label key={f.id} className="flex items-start gap-2 rounded-[9px] border border-[#f2f0f9] px-2.5 py-2 text-[13px]">
                  <input type="checkbox" name="unlocked" value={f.id} defaultChecked={defaultUnlocked.includes(f.id)} className="mt-0.5 h-4 w-4" />
                  <span><span className="font-semibold text-[#17151f]">{f.label}</span><span className="block text-[11.5px] text-[#9b93b5]">{AREA[f.area]}</span></span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-[#9b93b5]">Mereu deschise: Panou, Lucrări, Calendar, Clienți, Cereri, Hartă, Mesaje, Rapoarte, modulele de domeniu; pe telefon: lucrările, pașii, pozele, checklistul, semnătura, pontajul.</p>
          </div>
          <label className="text-[12.5px] font-semibold text-[#5c5670]">Demo-ul ține până la
            <input type="date" name="demoExpires" defaultValue={initialDate} className="mt-1 block rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[14px]" />
            <span className="mt-1 block text-[11.5px] font-normal text-[#9b93b5]">După dată, toate funcțiile de mai sus se blochează, iar banda de sus devine roșie. Datele rămân. Gol = fără dată.</span>
          </label>
        </div>
      )}
    </div>
  );
}

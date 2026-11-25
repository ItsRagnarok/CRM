"use client";

import { useActionState, useState } from "react";
import { PHASES } from "@/lib/ssm";
import { addTraining } from "./actions";

const input = "w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric";

/** O sesiune de instruire pentru unul sau mai mulți oameni (ex. toată echipa, periodic). */
export function TrainingForm({ people, teams, today }: { people: { id: string; name: string; team: string | null }[]; teams: string[]; today: string }) {
  const [state, action, pending] = useActionState(addTraining, undefined);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pickTeam = (t: string) => setSel(new Set(people.filter((p) => p.team === t).map((p) => p.id)));
  return (
    <details className="rounded-[13px] border border-border bg-white p-4">
      <summary className="cursor-pointer text-[14px] font-bold">+ Înregistrează o instruire</summary>
      <form
        action={(fd) => { sel.forEach((id) => fd.append("people", id)); action(fd); }}
        className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-[#344054]">
            Cine a fost instruit ({sel.size})
            {teams.map((t) => <button key={t} type="button" onClick={() => pickTeam(t)} className="rounded-full border border-border px-2.5 py-0.5 text-[12px]">{t}</button>)}
            <button type="button" onClick={() => setSel(new Set(people.map((p) => p.id)))} className="rounded-full border border-border px-2.5 py-0.5 text-[12px]">Toți</button>
            {sel.size > 0 && <button type="button" onClick={() => setSel(new Set())} className="text-[12px] text-muted underline">golește</button>}
          </div>
          <div className="grid max-h-[180px] grid-cols-2 gap-1 overflow-y-auto rounded-[9px] border border-[#eaecf0] p-2 sm:grid-cols-3">
            {people.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-[12.5px]">
                <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" /> {p.name}
              </label>
            ))}
          </div>
        </div>
        <label className="text-[12.5px] font-semibold text-[#344054]">Tipul instruirii
          <select name="phase" defaultValue="periodic" className={`${input} mt-1`}>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-[#344054]">Data
          <input name="doneOn" type="date" defaultValue={today} max={today} className={`${input} mt-1`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[#344054]">Cine a ținut instruirea
          <input name="instructor" maxLength={120} placeholder="ex. Ion Popescu, serviciu extern SSM" className={`${input} mt-1`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[#344054]">Durata (minute)
          <input name="duration" type="number" min={5} max={960} placeholder="ex. 120" className={`${input} mt-1`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[#344054] md:col-span-2">Tematica
          <input name="topic" maxLength={300} placeholder="ex. lucrul la înălțime, separarea instalațiilor electrice, prim ajutor" className={`${input} mt-1`} />
        </label>
        <p className="text-[12px] text-muted md:col-span-2">Următoarea instruire se calculează singură: peste 6 luni pentru teren, 12 luni pentru birou. Fiecare om primește notificare să confirme în aplicație.</p>
        <div className="flex items-center gap-3 md:col-span-2">
          <button disabled={pending || sel.size === 0} className="rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold disabled:opacity-50">{pending ? "Se salvează…" : `Salvează pentru ${sel.size} ${sel.size === 1 ? "om" : "oameni"}`}</button>
          {state?.ok && <span role="status" className="text-[12.5px] font-semibold text-success">Salvat. Oamenii au primit notificare să confirme.</span>}
          {state?.error && <span role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}

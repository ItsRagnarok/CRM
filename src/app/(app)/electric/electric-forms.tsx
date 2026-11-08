"use client";

import { useActionState, useRef } from "react";
import { addHidden, addMeasurement, addReport, signReport } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";
type State = { error?: string; success?: string } | undefined;

function Msg({ state }: { state: State }) {
  if (state?.error) return <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>;
  if (state?.success) return <p className="text-sm font-medium text-success" role="status">{state.success}</p>;
  return null;
}
function useResettable(fn: (prev: State, fd: FormData) => Promise<State>) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: State, fd: FormData) => { const r = await fn(prev, fd); if (r?.success) ref.current?.reset(); return r; }, undefined);
  return { ref, state, action, pending };
}

export function MeasurementForm({ jobId }: { jobId: string }) {
  const f = useResettable((p, fd) => addMeasurement(jobId, p, fd));
  return (
    <form ref={f.ref} action={f.action} className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-[14px] font-bold">Măsurătoare nouă</h3>
      <p className="mt-1 text-[12px] text-muted">Valorile le introduce tehnicianul. Platforma nu spune dacă o valoare e bună sau rea: rezultatul îl stabilește persoana autorizată.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><label className={label}>Tablou sau circuit</label><input name="label" required maxLength={160} className={input} placeholder="ex. TG · tablou general, C14 iluminat" /></div>
        <div><label className={label}>Tip</label><select name="kind" className={input} defaultValue="circuit"><option value="tablou">Tablou</option><option value="circuit">Circuit</option></select></div>
        <div><label className={label}>Rezultat stabilit</label><select name="result" className={input} defaultValue=""><option value="">Nestabilit</option><option value="conform">Conform</option><option value="neconform">Neconform</option></select></div>
        <div><label className={label}>Izolație (MΩ)</label><input name="insulation" inputMode="decimal" className={input} /></div>
        <div><label className={label}>Buclă (Ω)</label><input name="loop" inputMode="decimal" className={input} /></div>
        <div><label className={label}>Continuitate (Ω)</label><input name="continuity" inputMode="decimal" className={input} /></div>
        <div><label className={label}>Note</label><input name="notes" maxLength={1000} className={input} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={f.pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Adaugă</button><Msg state={f.state} /></div>
    </form>
  );
}

export function ReportForm({ jobId }: { jobId: string }) {
  const f = useResettable((p, fd) => addReport(jobId, p, fd));
  return (
    <form ref={f.ref} action={f.action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1"><label className={label}>Buletin sau proces-verbal nou</label><input name="title" required maxLength={160} className={input} placeholder="ex. PV recepție TG, buletin priză de pământ" /></div>
      <button disabled={f.pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Adaugă</button><Msg state={f.state} />
    </form>
  );
}

export function HiddenForm({ jobId }: { jobId: string }) {
  const f = useResettable((p, fd) => addHidden(jobId, p, fd));
  return (
    <form ref={f.ref} action={f.action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1"><label className={label}>Lucrare ascunsă nouă</label><input name="description" required maxLength={300} className={input} placeholder="ex. trasee îngropate în pardoseală, zona 3" /></div>
      <button disabled={f.pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Adaugă</button><Msg state={f.state} />
    </form>
  );
}

export function SignForm({ reportId, jobId, signers }: { reportId: string; jobId: string; signers: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(signReport, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={reportId} /><input type="hidden" name="jobId" value={jobId} />
      <select name="signer" required defaultValue="" className="rounded-lg border border-[#d0d5dd] px-2 py-1.5 text-[12.5px]" aria-label="Semnatar"><option value="" disabled>Semnatar…</option>{signers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <button disabled={pending} className="rounded-lg bg-electric px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-60">Semnează</button>
      <Msg state={state} />
    </form>
  );
}

"use client";

import { useActionState, useRef } from "react";
import { addBuilding, addUnit, importUnits, updateGasSettings } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";
type State = { error?: string; success?: string } | undefined;

function Msg({ state }: { state: State }) {
  if (state?.error) return <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>;
  if (state?.success) return <p className="text-sm font-medium text-success" role="status">{state.success}</p>;
  return null;
}

export function BuildingForm() {
  const [state, action, pending] = useActionState(addBuilding, undefined);
  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Bloc nou</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className={label}>Nume</label><input name="name" required maxLength={160} className={input} placeholder="ex. Bl. A4, Observatorului 12" /></div>
        <div><label className={label}>Adresă (opțional)</label><input name="address" maxLength={300} className={input} placeholder="Cluj-Napoca" /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{pending ? "Se salvează…" : "Creează blocul"}</button><Msg state={state} /></div>
    </form>
  );
}

export function SettingsForm({ inspectionMonths, revisionMonths }: { inspectionMonths: number; revisionMonths: number }) {
  const [state, action, pending] = useActionState(updateGasSettings, undefined);
  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Termenele firmei</h2>
      <p className="mt-1 text-[12.5px] text-muted">Cât de des se face verificarea și revizia. Valorile de pornire (24 și 120 de luni) sunt cele din sursele citite și nu au fost confirmate pe textul oficial. Confirmă-le cu un jurist sau cu operatorul.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className={label}>Verificare, la fiecare (luni)</label><input name="inspectionMonths" type="number" min={1} max={240} defaultValue={inspectionMonths} className={input} /></div>
        <div><label className={label}>Revizie, la fiecare (luni)</label><input name="revisionMonths" type="number" min={1} max={360} defaultValue={revisionMonths} className={input} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Salvează</button><Msg state={state} /></div>
    </form>
  );
}

export function ImportForm({ buildingId }: { buildingId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: State, fd: FormData) => {
    const r = await importUnits(buildingId, prev, fd);
    if (r?.success) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Import din Excel</h2>
      <p className="mt-1 text-[12.5px] text-muted">Copiază din Excel coloanele <b>Scară · Apartament · Nume · Telefon · Ultima verificare · Ultima revizie</b> și lipește-le aici (cu sau fără rândul de titlu). Datele ca ZZ.LL.AAAA. Un apartament existent se actualizează.</p>
      <textarea name="data" rows={6} required className={`${input} mt-3 font-mono text-[12.5px]`} placeholder={"1\t1\tIon Pop\t0740 000 000\t12.03.2024\t05.06.2016\n1\t2\tAna Dobre\t\t\t"} />
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{pending ? "Se importă…" : "Importă"}</button><Msg state={state} /></div>
    </form>
  );
}

export function UnitForm({ buildingId }: { buildingId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: State, fd: FormData) => {
    const r = await addUnit(buildingId, prev, fd);
    if (r?.success) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Apartament nou</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div><label className={label}>Scară</label><input name="stair" maxLength={40} className={input} /></div>
        <div><label className={label}>Apartament</label><input name="apartment" required maxLength={40} className={input} /></div>
        <div><label className={label}>Nume</label><input name="owner" maxLength={160} className={input} /></div>
        <div><label className={label}>Telefon</label><input name="phone" maxLength={40} className={input} /></div>
        <div><label className={label}>Ultima verificare</label><input name="lastInspection" type="date" className={input} /></div>
        <div><label className={label}>Ultima revizie</label><input name="lastRevision" type="date" className={input} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Adaugă</button><Msg state={state} /></div>
    </form>
  );
}

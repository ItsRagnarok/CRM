"use client";

import { useActionState } from "react";
import { addProject, saveProject, savePvSettings } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";
type State = { error?: string; success?: string } | undefined;

function Msg({ state }: { state: State }) {
  if (state?.error) return <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>;
  if (state?.success) return <p className="text-sm font-medium text-success" role="status">{state.success}</p>;
  return null;
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(addProject, undefined);
  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Dosar nou</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label}>Nume</label><input name="name" required maxLength={160} className={input} placeholder="ex. Casa Ionescu 8,8 kWp" /></div>
        <div><label className={label}>Persoană de contact</label><input name="contactName" maxLength={160} className={input} /></div>
        <div><label className={label}>Telefon</label><input name="contactPhone" maxLength={40} className={input} /></div>
        <div><label className={label}>Adresă</label><input name="address" maxLength={300} className={input} /></div>
        <div><label className={label}>Putere (kWp)</label><input name="kwp" inputMode="decimal" className={input} placeholder="8,8" /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{pending ? "Se salvează…" : "Creează dosarul"}</button><Msg state={state} /></div>
    </form>
  );
}

export function PvSettingsForm({ atrDays, certDays }: { atrDays: number; certDays: number }) {
  const [state, action, pending] = useActionState(savePvSettings, undefined);
  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Termenele operatorului</h2>
      <p className="mt-1 text-[12.5px] text-muted">Sursele citite dau termene diferite (15, 20 sau 30 de zile pentru ATR; 3 sau 10 pentru certificat). Alege reperul pe care îl folosești tu, din contract sau din scrisoarea operatorului, în zile calendaristice.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className={label}>ATR, termen (zile)</label><input name="atrDays" type="number" min={1} max={365} defaultValue={atrDays} className={input} /></div>
        <div><label className={label}>Certificat de racordare (zile)</label><input name="certDays" type="number" min={1} max={365} defaultValue={certDays} className={input} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">Salvează</button><Msg state={state} /></div>
    </form>
  );
}

export type ProjectValues = {
  name: string; stage: string; address: string | null; contact_name: string | null; contact_phone: string | null; kwp: number | null;
  operator_name: string | null; atr_number: string | null; notes: string | null;
} & Record<"offer_sent_on" | "contract_signed_on" | "advance_received_on" | "install_on" | "atr_filed_on" | "atr_received_on" | "cert_requested_on" | "cert_received_on" | "afm_filed_on" | "afm_paid_on" | "warranty_until", string | null>;

const DATES: [keyof ProjectValues, string][] = [
  ["offer_sent_on", "Ofertă trimisă"], ["contract_signed_on", "Contract semnat"], ["advance_received_on", "Avans încasat"], ["install_on", "Montaj (data)"],
  ["atr_filed_on", "ATR depus"], ["atr_received_on", "ATR primit"], ["cert_requested_on", "Certificat de racordare cerut"], ["cert_received_on", "Certificat primit"],
  ["afm_filed_on", "Dosar AFM depus"], ["afm_paid_on", "Decontare AFM primită"], ["warranty_until", "Garanție până la"],
];

export function EditForm({ id, v, stages }: { id: string; v: ProjectValues; stages: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState((prev: State, fd: FormData) => saveProject(id, prev, fd), undefined);
  return (
    <form action={action} className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Detalii și date</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><label className={label}>Nume</label><input name="name" required defaultValue={v.name} className={input} /></div>
        <div><label className={label}>Etapă</label><select name="stage" defaultValue={v.stage} className={input}>{stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
        <div><label className={label}>Contact</label><input name="contactName" defaultValue={v.contact_name ?? ""} className={input} /></div>
        <div><label className={label}>Telefon</label><input name="contactPhone" defaultValue={v.contact_phone ?? ""} className={input} /></div>
        <div><label className={label}>Putere (kWp)</label><input name="kwp" inputMode="decimal" defaultValue={v.kwp ?? ""} className={input} /></div>
        <div className="sm:col-span-3"><label className={label}>Adresă</label><input name="address" defaultValue={v.address ?? ""} className={input} /></div>
        <div className="sm:col-span-2"><label className={label}>Operator de distribuție</label><input name="operatorName" defaultValue={v.operator_name ?? ""} className={input} placeholder="ex. Distribuție Energie Electrică Romania" /></div>
        <div><label className={label}>Număr dosar / înregistrare ATR</label><input name="atrNumber" defaultValue={v.atr_number ?? ""} className={input} /></div>
        {DATES.map(([k, l]) => <div key={k}><label className={label}>{l}</label><input name={k} type="date" defaultValue={v[k] ?? ""} className={input} /></div>)}
        <div className="sm:col-span-3"><label className={label}>Note</label><textarea name="notes" rows={3} defaultValue={v.notes ?? ""} className={input} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{pending ? "Se salvează…" : "Salvează"}</button><Msg state={state} /></div>
    </form>
  );
}

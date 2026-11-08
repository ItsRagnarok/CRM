"use client";

import { useActionState, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addComplianceItem } from "./actions";
import { KIND_LABELS, TITLE_PRESETS, type ComplianceKind } from "@/lib/compliance";
import { DOMAINS } from "@/lib/domains";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";

export function ComplianceForm({ people, defaultKind }: { people: { id: string; name: string }[]; defaultKind: ComplianceKind }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ComplianceKind>(defaultKind);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: { error?: string; success?: boolean } | undefined, fd: FormData) => {
    const result = await addComplianceItem(prev, fd);
    if (result?.success) { formRef.current?.reset(); setOpen(false); }
    return result;
  }, undefined);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold">
        <Plus className="h-4 w-4" /> Adaugă document
      </button>
    );
  }
  return (
    <form ref={formRef} action={action} className="rounded-[14px] border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Document nou</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Tip</label>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as ComplianceKind)} className={input}>
            {(Object.keys(KIND_LABELS) as ComplianceKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Document</label>
          <input name="title" list="presets" required maxLength={160} className={input} placeholder="ex. Autorizație ANRE" />
          <datalist id="presets">{TITLE_PRESETS[kind].map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        {kind === "person" ? (
          <div>
            <label className={label}>Persoana</label>
            <select name="profileId" required className={input} defaultValue="">
              <option value="" disabled>Alege…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className={label}>{kind === "vehicle" ? "Număr de înmatriculare" : kind === "device" ? "Aparat și serie" : "La ce se referă"}</label>
            <input name="subject" required maxLength={160} className={input} placeholder={kind === "vehicle" ? "CJ 24 EFD" : kind === "device" ? "Manometru SN 4471" : "Denumire"} />
          </div>
        )}
        <div>
          <label className={label}>Domeniu (opțional)</label>
          <select name="domain" className={input} defaultValue="">
            <option value="">Toate</option>
            {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Emis la (opțional)</label>
          <input name="issuedOn" type="date" className={input} />
        </div>
        <div>
          <label className={label}>Expiră la</label>
          <input name="expiresOn" type="date" required className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Note (opțional)</label>
          <input name="notes" maxLength={2000} className={input} placeholder="ex. nr. legitimație, firma care a emis-o" />
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm font-medium text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{pending ? "Se salvează…" : "Salvează"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] border border-border px-4 py-2.5 text-[13.5px] font-semibold">Renunță</button>
      </div>
    </form>
  );
}

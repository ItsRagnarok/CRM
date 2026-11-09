"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createInvoiceForJob, type InvoiceState } from "./actions";

const field = "rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric";

export function InvoiceForm({ jobs, providerLabel, simulated }: { jobs: { id: string; label: string }[]; providerLabel: string | null; simulated: boolean }) {
  const [state, action, pending] = useActionState<InvoiceState | undefined, FormData>(createInvoiceForJob, undefined);
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <select name="jobId" required defaultValue="" className={field} aria-label="Lucrare">
        <option value="" disabled>Alege o lucrare terminată…</option>
        {jobs.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input name="laborAmount" type="number" step="0.01" min="0" placeholder="Manoperă" aria-label="Manoperă" className={field} />
        <input name="materialsAmount" type="number" step="0.01" min="0" placeholder="Materiale" aria-label="Materiale" className={field} />
        <input name="travelAmount" type="number" step="0.01" min="0" placeholder="Deplasare" aria-label="Deplasare" className={field} />
        <input name="otherAmount" type="number" step="0.01" min="0" placeholder="Altele" aria-label="Altele" className={field} />
      </div>
      <button type="submit" disabled={pending} className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60">
        <Plus className="h-4 w-4" /> {pending ? "Se emite…" : providerLabel ? `Emite în ${providerLabel}${simulated ? " (simulat)" : ""}` : "Generează factură"}
      </button>
      {state?.error && <p role="alert" className="rounded-[9px] bg-danger-bg p-2.5 text-[12.5px] font-semibold text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-[9px] bg-success-bg p-2.5 text-[12.5px] font-semibold text-success">{state.ok}</p>}
      <p className="mt-1 rounded-[9px] bg-neutral-bg p-2.5 text-[11.5px] leading-relaxed text-muted-2">
        {providerLabel
          ? simulated
            ? "Mod demonstrativ: facturile se numerotează aici și nu se trimit la niciun furnizor real."
            : `Factura se emite direct în contul tău ${providerLabel}; numărul fiscal vine de la furnizor.`
          : "Conectează SmartBill sau Oblio din Setări → Integrări ca să emiți facturile direct din platformă."}
      </p>
    </form>
  );
}

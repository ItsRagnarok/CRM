"use client";

import { useActionState } from "react";
import { saveBillingRates, type ActionState } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";

/** Prețurile de vânzare folosite când factura se precompletează dintr-o lucrare (ore × tarif, materiale + adaos). */
export function BillingRatesForm({ laborRate, markup, canEdit }: { laborRate: number | null; markup: number; canEdit: boolean }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(saveBillingRates, undefined);
  return (
    <form action={action} className="rounded-[13px] border border-border bg-white p-[22px]">
      <div className="mb-1 text-[15px] font-bold">Prețuri pentru facturarea lucrărilor</div>
      <p className="mb-4 max-w-[70ch] text-[12.5px] text-muted-2">
        Când emiți factura dintr-o lucrare, rândurile se completează singure: orele lucrate × tariful orar și materialele consumate la prețul de achiziție plus adaosul. Le poți schimba pe fiecare factură.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-semibold text-[#344054]">Tarif manoperă (lei/oră, fără TVA)
          <input name="laborRate" type="number" step="0.01" min="0" defaultValue={laborRate ?? ""} disabled={!canEdit} placeholder="ex. 150" className={`${input} mt-1`} />
        </label>
        <label className="text-[12px] font-semibold text-[#344054]">Adaos la materiale (%)
          <input name="markup" type="number" step="0.1" min="0" max="500" defaultValue={markup} disabled={!canEdit} className={`${input} mt-1`} />
        </label>
      </div>
      {canEdit && <button type="submit" disabled={pending} className="mt-4 rounded-[10px] bg-[#101828] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">{pending ? "Se salvează…" : "Salvează prețurile"}</button>}
      {state?.error && <p role="alert" className="mt-3 rounded-[10px] bg-danger-bg p-3 text-[13px] font-semibold text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-3 rounded-[10px] bg-success-bg p-3 text-[13px] font-semibold text-success">{state.ok}</p>}
    </form>
  );
}

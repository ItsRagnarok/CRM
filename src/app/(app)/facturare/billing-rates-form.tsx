"use client";

import { useActionState, useState } from "react";
import { saveBillingRates, type ActionState } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";

/** TVA-ul firmei și prețurile de vânzare folosite când factura se precompletează dintr-o lucrare (ore × tarif, materiale + adaos). */
export function BillingRatesForm({ laborRate, markup, vatPercent, canEdit }: { laborRate: number | null; markup: number; vatPercent: number; canEdit: boolean }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(saveBillingRates, undefined);
  const [vatPayer, setVatPayer] = useState(vatPercent > 0);
  return (
    <form action={action} className="rounded-[13px] border border-border bg-white p-[22px]">
      <div className="mb-1 text-[15px] font-bold">TVA și prețuri pentru facturare</div>
      <p className="mb-4 max-w-[70ch] text-[12.5px] text-muted-2">
        Când emiți factura dintr-o lucrare, rândurile se completează singure: orele lucrate × tariful orar și materialele consumate la prețul de achiziție plus adaosul, cu cota TVA de mai jos. Le poți schimba pe fiecare factură.
      </p>
      <div className="mb-4 rounded-[11px] border border-border p-3.5">
        <label className="flex items-center gap-2.5 text-[13.5px] font-bold">
          <input type="checkbox" name="vatPayer" checked={vatPayer} onChange={(e) => setVatPayer(e.target.checked)} disabled={!canEdit} className="h-[18px] w-[18px] accent-[#101828]" />
          Firma e plătitoare de TVA
        </label>
        {vatPayer ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] font-semibold text-[#344054]">Cota TVA implicită (%)
              <input name="vatPercent" type="number" step="0.01" min="1" max="100" defaultValue={vatPercent > 0 ? vatPercent : 21} disabled={!canEdit} className={`${input} mt-1`} />
            </label>
            <p className="self-end pb-2 text-[11.5px] text-muted-2">21% e cota standard. Pe fiecare rând al facturii o poți schimba (11%, 0%).</p>
          </div>
        ) : (
          <p className="mt-2 text-[12.5px] text-[#344054]">
            Facturile se emit fără TVA (0%), iar coloana TVA nu mai apare la facturare. Mențiunea de pe factură („neplătitor de TVA” sau articolul de scutire) o pune SmartBill sau Oblio, după setările contului; verifică prima factură acolo.
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-semibold text-[#344054]">Tarif manoperă (lei/oră, fără TVA)
          <input name="laborRate" type="number" step="0.01" min="0" defaultValue={laborRate ?? ""} disabled={!canEdit} placeholder="ex. 150" className={`${input} mt-1`} />
        </label>
        <label className="text-[12px] font-semibold text-[#344054]">Adaos la materiale (%)
          <input name="markup" type="number" step="0.1" min="0" max="500" defaultValue={markup} disabled={!canEdit} className={`${input} mt-1`} />
        </label>
      </div>
      {canEdit && <button type="submit" disabled={pending} className="mt-4 rounded-[10px] bg-[#101828] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">{pending ? "Se salvează…" : "Salvează"}</button>}
      {state?.error && <p role="alert" className="mt-3 rounded-[10px] bg-danger-bg p-3 text-[13px] font-semibold text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-3 rounded-[10px] bg-success-bg p-3 text-[13px] font-semibold text-success">{state.ok}</p>}
    </form>
  );
}

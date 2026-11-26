"use client";

import { useActionState, useState } from "react";
import { saveInvoicingConnection, testInvoicingConnection, type InvoicingState } from "./invoicing-actions";
import { DisconnectInvoicingButton } from "./disconnect-invoicing-button";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";

type Initial = { provider: "smartbill" | "oblio"; accountEmail: string; vatCode: string; series: string; proformaSeries: string | null; receiptSeries: string | null; taxPercent: number; dueDays: number; sendEmail: boolean; simulated: boolean } | null;

export function InvoicingForm({ initial, canEdit }: { initial: Initial; canEdit: boolean }) {
  const [provider, setProvider] = useState<"smartbill" | "oblio">(initial?.provider ?? "smartbill");
  const [saveState, save, saving] = useActionState<InvoicingState | undefined, FormData>(saveInvoicingConnection, undefined);
  const [testState, test, testing] = useActionState<InvoicingState | undefined, FormData>(testInvoicingConnection, undefined);
  const isSb = provider === "smartbill";
  const busy = saving || testing;

  return (
    <div className="rounded-[13px] border border-border bg-white p-[22px]">
      <div className="mb-1 text-[15px] font-bold">Facturare: SmartBill sau Oblio</div>
      <p className="mb-4 max-w-[70ch] text-[12.5px] text-muted-2">
        Conectezi o singură dată contul de facturare al firmei. Apoi emiți facturile direct din Facturare. Numărul fiscal îl dă furnizorul, platforma nu inventează numere.
      </p>
      {initial?.simulated && (
        <p className="mb-4 rounded-[10px] bg-warning-bg p-3 text-[12.5px] font-semibold text-warning" role="status">
          Cont demonstrativ: facturile se emit simulat, fără apeluri către furnizor. Pentru un cont real, completează datele de mai jos și salvează.
        </p>
      )}
      {!canEdit && <p className="mb-4 rounded-[10px] bg-neutral-bg p-3 text-[12.5px] text-muted">Doar administratorul poate schimba conexiunea.</p>}
      <form className="grid gap-3 sm:grid-cols-2" aria-label="Conectare facturare">
        <div className="sm:col-span-2 inline-flex w-fit gap-1 rounded-full border border-border bg-neutral-bg p-1" role="group" aria-label="Furnizor">
          {(["smartbill", "oblio"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={provider === p} disabled={!canEdit} onClick={() => setProvider(p)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${provider === p ? "bg-[#1f2024] text-white" : "text-[#344054]"}`}>{p === "smartbill" ? "SmartBill" : "Oblio"}</button>
          ))}
        </div>
        <input type="hidden" name="provider" value={provider} />
        <div><label className={label} htmlFor="inv-email">{isSb ? "E-mail cont SmartBill" : "Client ID (e-mailul contului Oblio)"}</label><input id="inv-email" name="accountEmail" required defaultValue={initial?.accountEmail ?? ""} disabled={!canEdit} className={input} autoComplete="off" /></div>
        <div><label className={label} htmlFor="inv-secret">{isSb ? "Token API" : "Client Secret"}</label><input id="inv-secret" name="secret" type="password" disabled={!canEdit} className={input} autoComplete="new-password" placeholder={initial && !initial.simulated ? "Lasă gol ca să păstrezi cheia salvată" : ""} />
          <p className="mt-1 text-[11.5px] text-muted-2">{isSb ? "SmartBill, la Cloud → Integrări → API." : "Oblio, la Setări → Date cont."} Se stochează criptat și nu se mai afișează.</p></div>
        <div><label className={label} htmlFor="inv-cif">CIF firmă emitentă</label><input id="inv-cif" name="vatCode" required defaultValue={initial?.vatCode ?? ""} disabled={!canEdit} className={input} placeholder="RO12345678" /></div>
        <div><label className={label} htmlFor="inv-series">Serie factură (exact ca în cont)</label><input id="inv-series" name="series" required defaultValue={initial?.series ?? ""} disabled={!canEdit} className={input} placeholder="ex. EF" /></div>
        <div><label className={label} htmlFor="inv-pf">Serie proformă (opțional)</label><input id="inv-pf" name="proformaSeries" defaultValue={initial?.proformaSeries ?? ""} disabled={!canEdit} className={input} placeholder="ex. EFP" />
          <p className="mt-1 text-[11.5px] text-muted-2">Ca să emiți și proforme (oferte cu valoare) din platformă.</p></div>
        <div><label className={label} htmlFor="inv-ch">Serie chitanță (opțional)</label><input id="inv-ch" name="receiptSeries" defaultValue={initial?.receiptSeries ?? ""} disabled={!canEdit} className={input} placeholder="ex. EFC" />
          <p className="mt-1 text-[11.5px] text-muted-2">Pentru încasările în numerar: se emite chitanță. Fără serie, numerarul se trece ca „altă încasare”.</p></div>
        <div><label className={label} htmlFor="inv-due">Termen de plată (zile)</label><input id="inv-due" name="dueDays" type="number" min="0" max="365" defaultValue={initial?.dueDays ?? 15} disabled={!canEdit} className={input} /></div>
        <p className="self-end pb-2 text-[11.5px] text-muted-2">Dacă firma e plătitoare de TVA și cota implicită se setează mai jos, în „TVA și prețuri pentru facturare”.</p>
        <label className="flex items-center gap-2 text-[13px] font-semibold sm:col-span-2"><input type="checkbox" name="sendEmail" defaultChecked={initial?.sendEmail ?? false} disabled={!canEdit} className="h-4 w-4" /> Trimite factura pe e-mail clientului (dacă are adresă)</label>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button type="submit" formAction={test} disabled={busy} className="rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{testing ? "Se testează…" : "Testează conexiunea"}</button>
            <button type="submit" formAction={save} disabled={busy} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold disabled:opacity-60">{saving ? "Se salvează…" : "Salvează"}</button>
            {initial && <DisconnectInvoicingButton label={initial.provider === "oblio" ? "Oblio" : "SmartBill"} />}
          </div>
        )}
      </form>
      {testState?.error && <p role="alert" className="mt-3 rounded-[10px] bg-danger-bg p-3 text-[13px] font-semibold text-danger">{testState.error}</p>}
      {testState?.ok && <p role="status" className="mt-3 rounded-[10px] bg-success-bg p-3 text-[13px] font-semibold text-success">{testState.ok}</p>}
      {saveState?.error && <p role="alert" className="mt-3 rounded-[10px] bg-danger-bg p-3 text-[13px] font-semibold text-danger">{saveState.error}</p>}
      {saveState?.ok && <p role="status" className="mt-3 rounded-[10px] bg-success-bg p-3 text-[13px] font-semibold text-success">{saveState.ok}</p>}
    </div>
  );
}

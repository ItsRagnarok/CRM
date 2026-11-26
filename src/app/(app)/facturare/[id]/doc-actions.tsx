"use client";

import { useActionState, useState } from "react";
import { Ban, Loader2, Mail, RotateCcw, Send, Undo2, Wallet } from "lucide-react";
import { cancelAction, einvoiceAction, emailAction, recordPayment, reverseAction, type ActionState } from "../actions";

const field = "w-full rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-electric";
const lbl = "mb-1 block text-[12px] font-semibold text-[#344054]";

function Result({ state }: { state?: ActionState }) {
  if (state?.error) return <p role="alert" className="mt-2 rounded-[10px] bg-danger-bg p-2.5 text-[12.5px] font-semibold text-danger">{state.error}</p>;
  if (state?.ok) return <p role="status" className="mt-2 rounded-[10px] bg-success-bg p-2.5 text-[12.5px] font-semibold text-success">{state.ok}</p>;
  return null;
}

export function PaymentForm({ id, rest, today, hasReceiptSeries }: { id: string; rest: number; today: string; hasReceiptSeries: boolean }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(recordPayment, undefined);
  return (
    <form action={action} className="grid grid-cols-2 gap-3">
      <input type="hidden" name="id" value={id} />
      <div><label className={lbl} htmlFor="pay-amount">Suma (lei)</label><input id="pay-amount" name="amount" type="number" step="0.01" min="0.01" max={rest} defaultValue={rest.toFixed(2)} className={`${field} tabular-nums`} required /></div>
      <div><label className={lbl} htmlFor="pay-date">Data</label><input id="pay-date" name="date" type="date" max={today} defaultValue={today} className={field} required /></div>
      <div><label className={lbl} htmlFor="pay-method">Cum</label>
        <select id="pay-method" name="method" defaultValue="ordin_plata" className={field}>
          <option value="ordin_plata">Ordin de plată</option><option value="numerar">Numerar{hasReceiptSeries ? " (chitanță)" : ""}</option><option value="card">Card</option><option value="alta">Altă încasare</option>
        </select>
      </div>
      <div><label className={lbl} htmlFor="pay-doc">Nr. document</label><input id="pay-doc" name="document" placeholder="opțional" className={field} /></div>
      <button type="submit" disabled={pending} className="col-span-2 flex items-center justify-center gap-2 rounded-[11px] bg-electric px-4 py-2.5 text-[13.5px] font-extrabold disabled:opacity-50">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Înregistrează încasarea
      </button>
      <div className="col-span-2"><Result state={state} /></div>
    </form>
  );
}

export function EmailForm({ id, email }: { id: string; email: string }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(emailAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <input name="to" type="email" defaultValue={email} placeholder="client@firma.ro" className={field} aria-label="Adresa clientului" required />
        <button type="submit" disabled={pending} className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-3 text-[12.5px] font-bold disabled:opacity-50">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Trimite
        </button>
      </div>
      <Result state={state} />
    </form>
  );
}

export function EinvoiceButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(einvoiceAction, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[12.5px] font-bold disabled:opacity-50">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Trimite în SPV (e-Factura)
      </button>
      <Result state={state} />
    </form>
  );
}

/** Acțiunile care nu se pot desface ușor cer o a doua confirmare chiar în pagină. */
export function DangerActions({ id, canCancel, canRestore, canReverse, docLabel }: { id: string; canCancel: boolean; canRestore: boolean; canReverse: boolean; docLabel: string }) {
  const [ask, setAsk] = useState<null | "cancel" | "reverse">(null);
  const [cancelState, cancel, cancelling] = useActionState<ActionState | undefined, FormData>(cancelAction, undefined);
  const [reverseState, reverse, reversing] = useActionState<ActionState | undefined, FormData>(reverseAction, undefined);
  const btn = "flex w-full items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12.5px] font-bold disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2">
      {canRestore && (
        <form action={cancel}>
          <input type="hidden" name="id" value={id} /><input type="hidden" name="restore" value="1" />
          <button type="submit" disabled={cancelling} className={`${btn} border-[#d0d5dd] bg-white`}><RotateCcw className="h-3.5 w-3.5" /> Restaurează documentul</button>
        </form>
      )}
      {canCancel && (ask === "cancel" ? (
        <form action={cancel} className="rounded-[11px] border border-danger/40 bg-danger-bg p-3">
          <input type="hidden" name="id" value={id} />
          <p className="mb-2 text-[12.5px] font-semibold text-danger">Anulezi {docLabel}? Se anulează și la furnizor. Se poate restaura.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={cancelling} className="rounded-[9px] bg-danger px-3 py-1.5 text-[12.5px] font-bold text-white">{cancelling ? "Se anulează…" : "Da, anulează"}</button>
            <button type="button" onClick={() => setAsk(null)} className="px-2 text-[12.5px] font-semibold text-muted">Renunță</button>
          </div>
        </form>
      ) : <button type="button" onClick={() => setAsk("cancel")} className={`${btn} border-[#d0d5dd] bg-white text-danger`}><Ban className="h-3.5 w-3.5" /> Anulează</button>)}
      {canReverse && (ask === "reverse" ? (
        <form action={reverse} className="rounded-[11px] border border-danger/40 bg-danger-bg p-3">
          <input type="hidden" name="id" value={id} />
          <p className="mb-2 text-[12.5px] font-semibold text-danger">Emiți o factură de stornare pentru {docLabel}, cu aceleași rânduri în minus? Nu se poate desface.</p>
          <div className="flex gap-2">
            <button type="submit" disabled={reversing} className="rounded-[9px] bg-danger px-3 py-1.5 text-[12.5px] font-bold text-white">{reversing ? "Se emite…" : "Da, stornează"}</button>
            <button type="button" onClick={() => setAsk(null)} className="px-2 text-[12.5px] font-semibold text-muted">Renunță</button>
          </div>
        </form>
      ) : <button type="button" onClick={() => setAsk("reverse")} className={`${btn} border-[#d0d5dd] bg-white`}><Undo2 className="h-3.5 w-3.5" /> Stornează (factură în minus)</button>)}
      <Result state={cancelState ?? reverseState} />
    </div>
  );
}

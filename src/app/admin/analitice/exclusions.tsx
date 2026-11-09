"use client";

import { useActionState } from "react";
import { addExclusion, removeExclusion, type ExclusionState } from "./actions";

export type Exclusion = { hash: string; label: string; created_at: string };

export function Exclusions({ items }: { items: Exclusion[] }) {
  const [state, action, pending] = useActionState<ExclusionState | undefined, FormData>(addExclusion, undefined);
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-[15px] font-bold">Adrese IP excluse</h2>
      <p className="mb-3 mt-1 max-w-[75ch] text-[12.5px] text-muted">
        Vizitele de pe aceste adrese nu se numără. Adresa nu se salvează: păstrăm doar un cod ireversibil. Pentru IPv6 se compară prefixul rețelei (primii 64 de biți), pentru că restul se schimbă singur.
      </p>
      <form action={action} className="flex flex-wrap items-end gap-2">
        <div><label htmlFor="ex-ip" className="mb-1 block text-[12px] font-semibold text-muted">Adresă IP (gol = adresa mea curentă)</label>
          <input id="ex-ip" name="ip" placeholder="ex. 82.78.0.178" className="w-64 rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13px]" autoComplete="off" /></div>
        <div><label htmlFor="ex-label" className="mb-1 block text-[12px] font-semibold text-muted">Etichetă</label>
          <input id="ex-label" name="label" placeholder="ex. Birou" maxLength={80} className="w-48 rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13px]" /></div>
        <button disabled={pending} className="rounded-[10px] bg-purple px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60">{pending ? "Se salvează…" : "Exclude"}</button>
      </form>
      {state?.error && <p role="alert" className="mt-3 rounded-lg bg-danger-bg p-2.5 text-[13px] font-semibold text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-3 rounded-lg bg-success-bg p-2.5 text-[13px] font-semibold text-success">{state.ok}</p>}
      <ul className="mt-4 divide-y divide-[#eef0f4]">
        {items.length === 0 && <li className="py-2 text-[13px] text-muted">Nicio adresă exclusă.</li>}
        {items.map((x) => (
          <li key={x.hash} className="flex items-center justify-between gap-3 py-2 text-[13px]">
            <span><b>{x.label || "Fără etichetă"}</b> <span className="text-muted">· cod {x.hash.slice(0, 8)}… · din {new Date(x.created_at).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" })}</span></span>
            <form action={removeExclusion}><input type="hidden" name="hash" value={x.hash} /><button className="text-[12.5px] font-semibold text-danger">Scoate</button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}

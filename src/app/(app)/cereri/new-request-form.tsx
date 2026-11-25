"use client";

import { useActionState, useEffect, useRef } from "react";
import { addRequest } from "./actions";
import { REQUEST_SOURCES, WINDOWS } from "@/lib/service-requests";
import { domainLabel } from "@/lib/domains";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric";
const label = "mb-1 block text-[12px] font-semibold text-[#344054]";

/** „Notează o cerere”: ce primește biroul la telefon, pe e-mail sau pe WhatsApp. */
export function NewRequestForm({ clients, enabledDomains }: { clients: { id: string; name: string }[]; enabledDomains: string[] }) {
  const [state, action, pending] = useActionState(addRequest, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <section className="rounded-[13px] border border-border bg-white p-4">
      <div className="text-[14px] font-bold text-foreground">Notează o cerere</div>
      <form ref={ref} action={action} className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="rq-source" className={label}>De unde vine</label>
            <select id="rq-source" name="source" defaultValue="telefon" className={input}>
              {REQUEST_SOURCES.filter((s) => s.id !== "site" && s.id !== "tehnician").map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rq-client" className={label}>Client existent</label>
            <select id="rq-client" name="clientId" defaultValue="" className={input}>
              <option value="">Client nou</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="rq-name" className={label}>Nume (persoană sau firmă)</label>
          <input id="rq-name" name="contactName" required maxLength={120} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="rq-phone" className={label}>Telefon</label>
            <input id="rq-phone" name="phone" type="tel" maxLength={40} className={input} />
          </div>
          <div>
            <label htmlFor="rq-email" className={label}>E-mail</label>
            <input id="rq-email" name="email" type="email" maxLength={160} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="rq-address" className={label}>Adresa lucrării</label>
          <input id="rq-address" name="address" maxLength={300} className={input} />
        </div>
        <div>
          <label htmlFor="rq-desc" className={label}>Ce cere clientul</label>
          <textarea id="rq-desc" name="description" required rows={3} maxLength={2000} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="rq-date" className={label}>Ziua dorită</label>
            <input id="rq-date" name="preferredDate" type="date" className={input} />
          </div>
          <div>
            <label htmlFor="rq-window" className={label}>Intervalul dorit</label>
            <select id="rq-window" name="preferredWindow" defaultValue="" className={input}>
              <option value="">—</option>
              {WINDOWS.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {enabledDomains.length > 1 && (
            <select name="domain" defaultValue="" aria-label="Domeniu" className="rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[13px]">
              <option value="">Domeniu: oricare</option>
              {enabledDomains.map((d) => <option key={d} value={d}>{domainLabel(d)}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#344054]">
            <input type="checkbox" name="urgent" /> Urgent
          </label>
        </div>
        {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-[#b42318]">{state.error}</p>}
        {state?.ok && <p role="status" className="text-[12.5px] font-semibold text-success">Cererea a fost notată.</p>}
        <button type="submit" disabled={pending} className="rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-[#1f2024] disabled:opacity-60">
          {pending ? "Se salvează…" : "Salvează cererea"}
        </button>
      </form>
    </section>
  );
}

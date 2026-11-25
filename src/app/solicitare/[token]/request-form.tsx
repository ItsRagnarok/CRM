"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitPublicRequest } from "./actions";
import { WINDOWS } from "@/lib/service-requests";
import { CHANNELS, MARKETING_CHANNELS } from "@/lib/contact-prefs";

const DOMAIN_TEXT: Record<string, string> = { electric: "Instalații electrice", gaze: "Instalații de gaze", fotovoltaic: "Panouri fotovoltaice" };
const input = "w-full rounded-[11px] border border-[#cfd8cd] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#2f6b12] focus:ring-2 focus:ring-[#2f6b12]/20";
const label = "mb-1.5 block text-[13.5px] font-semibold";

export function RequestForm({ token, domains }: { token: string; domains: string[] }) {
  const [state, action, pending] = useActionState(submitPublicRequest.bind(null, token), undefined);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-2xl border border-[#cfe6b8] bg-white p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#2f6b12]" aria-hidden />
        <h2 className="mt-3 text-xl font-extrabold">Am primit cererea</h2>
        <p className="mt-2 text-[14.5px] text-[#5b6a61]">Te contactăm cât mai repede ca să stabilim ziua și ora.</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#dfe5dd] bg-white p-5">
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="website">Nu completa acest câmp</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {domains.length > 1 && (
        <div>
          <label htmlFor="domain" className={label}>Ce fel de lucrare</label>
          <select id="domain" name="domain" defaultValue="" className={input}>
            <option value="">Nu știu sau altceva</option>
            {domains.map((d) => <option key={d} value={d}>{DOMAIN_TEXT[d] ?? d}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="description" className={label}>Ce s-a întâmplat sau ce îți trebuie</label>
        <textarea id="description" name="description" required minLength={3} maxLength={2000} rows={4} placeholder="Ex: siguranța sare când pornesc boilerul; aș vrea o verificare." className={input} />
      </div>
      <div>
        <label htmlFor="name" className={label}>Numele tău (sau al firmei)</label>
        <input id="name" name="name" required maxLength={120} autoComplete="name" className={input} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={label}>Telefon</label>
          <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
        </div>
        <div>
          <label htmlFor="email" className={label}>E-mail</label>
          <input id="email" name="email" type="email" maxLength={160} autoComplete="email" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="address" className={label}>Adresa unde e nevoie de intervenție</label>
        <input id="address" name="address" maxLength={300} autoComplete="street-address" className={input} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="preferredDate" className={label}>Ziua care îți convine</label>
          <input id="preferredDate" name="preferredDate" type="date" min={today} className={input} />
        </div>
        <div>
          <label htmlFor="window" className={label}>Intervalul</label>
          <select id="window" name="window" defaultValue="" className={input}>
            <option value="">Oricând</option>
            {WINDOWS.filter((w) => w.id !== "oricand").map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className={label}>Cum vrei să te anunțe firma despre lucrare?</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14.5px]">
          {CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input type="radio" name="channel" value={c.id} className="h-4 w-4 accent-[#c6ff4a]" />
              {c.id === "telefon" ? "Apel telefonic" : c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={label}>Oferte și noutăți de la firmă (opțional)</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14.5px]">
          {MARKETING_CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input type="checkbox" name="marketing" value={c.id} className="h-4 w-4 accent-[#c6ff4a]" />
              Da, pe {c.label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-[12.5px] text-[#7a887f]">Nebifat înseamnă fără oferte. Mesajele despre lucrarea ta le primești oricum.</p>
      </fieldset>
      {state?.error && <p role="alert" className="text-[14px] font-semibold text-[#b42318]">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-[12px] bg-[#c6ff4a] px-5 py-3 text-[15.5px] font-extrabold text-[#16201b] disabled:opacity-60">
        {pending ? "Se trimite…" : "Trimite cererea"}
      </button>
      <p className="text-center text-[12.5px] text-[#7a887f]">Lasă cel puțin un telefon sau un e-mail.</p>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { CHANNELS, MARKETING_CHANNELS } from "@/lib/contact-prefs";
import { saveStatusPrefs } from "./actions";

/** „Cum preferați să vă anunțăm?” — pe linkul de status, fără cont. Ofertele sunt separate și opționale. */
export function StatusPrefsForm({ token, company, channel, marketing, hasPhone, hasEmail }: { token: string; company: string; channel: string | null; marketing: string[]; hasPhone: boolean; hasEmail: boolean }) {
  const [ch, setCh] = useState(channel ?? "");
  const [mk, setMk] = useState<string[]>(marketing);
  const [saved, setSaved] = useState({ ch: channel ?? "", mk: marketing.slice().sort().join() });
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = ch !== saved.ch || mk.slice().sort().join() !== saved.mk;
  const channels = CHANNELS.filter((c) => (c.id === "email" ? hasEmail : hasPhone));
  const mChannels = MARKETING_CHANNELS.filter((c) => (c.id === "email" ? hasEmail : hasPhone));
  const chip = (on: boolean) => `flex cursor-pointer items-center rounded-full border px-3.5 py-2 text-[14px] font-bold ${on ? "border-[#c6ff4a] bg-[#c6ff4a] text-[#111a17]" : "border-white/20 text-[#f6f9f6]"}`;

  return (
    <form
      className="mt-3 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("channel", ch);
        mk.forEach((c) => fd.append("marketing", c));
        start(async () => {
          const r = await saveStatusPrefs(token, fd);
          if (r.error) setMsg({ text: r.error });
          else {
            setSaved({ ch, mk: mk.slice().sort().join() });
            setMsg({ ok: true, text: "Am salvat. Mulțumim!" });
          }
        });
      }}
    >
      <fieldset>
        <legend className="text-[14px] text-[#b7c2ba]">Pentru mesajele despre lucrare (programare, sosire, documente):</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {channels.map((c) => (
            <label key={c.id} className={chip(ch === c.id)}>
              <input type="radio" name="channel" value={c.id} checked={ch === c.id} onChange={() => setCh(c.id)} className="sr-only" />
              {c.id === "telefon" ? "Apel telefonic" : c.label}
            </label>
          ))}
        </div>
      </fieldset>
      {mChannels.length > 0 && (
        <fieldset>
          <legend className="text-[14px] text-[#b7c2ba]">Oferte și noutăți de la {company} (opțional):</legend>
          <div className="mt-2 flex flex-col gap-2">
            {mChannels.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 text-[14.5px]">
                <input type="checkbox" checked={mk.includes(c.id)} onChange={() => setMk((m) => (m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id]))} className="h-5 w-5 accent-[#c6ff4a]" />
                Da, pe {c.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-[#b7c2ba]">Nebifat înseamnă că nu primiți oferte. Puteți schimba oricând, de aici.</p>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!dirty || pending} className="rounded-[12px] bg-[#c6ff4a] px-5 py-2.5 text-[15px] font-extrabold text-[#111a17] disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează"}
        </button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-[14px] font-semibold ${msg.ok ? "text-[#c6ff4a]" : "text-[#ffb4a8]"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

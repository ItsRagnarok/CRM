"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CHANNELS, MARKETING_CHANNELS, SOURCES, type MarketingChannel } from "@/lib/contact-prefs";
import { saveContactPrefs } from "../actions";

/**
 * „Cum îl contactăm”: canalul pentru mesajele despre lucrări și acordul separat pentru oferte.
 * Formular controlat, trimis manual: bifele nu se resetează după salvare.
 */
export function ContactPrefsCard({ clientId, channel, marketing, hasPhone, hasEmail }: { clientId: string; channel: string | null; marketing: string[]; hasPhone: boolean; hasEmail: boolean }) {
  const router = useRouter();
  const [ch, setCh] = useState(channel ?? "");
  const [mk, setMk] = useState<string[]>(marketing);
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = ch !== (channel ?? "") || mk.slice().sort().join() !== marketing.slice().sort().join();

  const toggle = (c: MarketingChannel) => setMk((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]));
  const missing = (c: string) => ((c === "email" && !hasEmail) || (c !== "email" && !hasPhone));

  return (
    <form
      className="flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("channel", ch);
        mk.forEach((c) => fd.append("marketing", c));
        fd.set("source", source);
        fd.set("note", note);
        start(async () => {
          const r = await saveContactPrefs(clientId, fd);
          if (r.error) setMsg({ text: r.error });
          else {
            setMsg({ ok: true, text: r.changed ? "Salvat. Schimbarea a intrat în istoric." : "Nimic de schimbat." });
            setNote("");
            setSource("");
            router.refresh();
          }
        });
      }}
    >
      <fieldset>
        <legend className="text-[13px] font-bold text-foreground">Mesajele despre lucrări</legend>
        <p className="mt-0.5 text-[12px] text-muted-2">Confirmarea programării, „echipa e pe drum”, reprogramări, documente. Butonul canalului ales apare primul peste tot.</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {[{ id: "", label: "Nu a spus" }, ...CHANNELS].map((c) => (
            <label key={c.id || "none"} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold ${ch === c.id ? "border-electric bg-electric" : "border-border text-[#344054]"}`}>
              <input type="radio" name="channel" value={c.id} checked={ch === c.id} onChange={() => setCh(c.id)} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
        {ch && missing(ch) && <p className="mt-1.5 text-[12px] font-semibold text-warning">Clientul nu are {ch === "email" ? "e-mail" : "telefon"} în fișă. Adaugă-l din „Editează”.</p>}
      </fieldset>

      <fieldset>
        <legend className="text-[13px] font-bold text-foreground">Oferte, promoții, noutăți</legend>
        <p className="mt-0.5 text-[12px] text-muted-2">Doar cu acordul clientului, pe canalele bifate. Nebifat = nu primește oferte. Clientul poate retrage acordul oricând, inclusiv singur, de pe linkul de status.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {MARKETING_CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-[13px] font-semibold text-[#344054]">
              <input type="checkbox" checked={mk.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-[#0b6b3a]" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      {dirty && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-[12.5px] font-semibold text-[#344054]">
            De unde știi?
            <select required value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px]">
              <option value="">Alege…</option>
              {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="text-[12.5px] font-semibold text-[#344054]">
            Notă (opțional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="ex. a cerut să nu fie sunat după ora 18" className="mt-1 w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px]" />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!dirty || pending} className="rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează"}
        </button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-[12.5px] font-semibold ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

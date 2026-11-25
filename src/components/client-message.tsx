"use client";

import { useState } from "react";
import { waPhone } from "@/lib/client-messages";
import { channelActions, preferredHint } from "@/lib/contact-prefs";

/** Un mesaj despre lucrare, gata de trimis clientului pe canalul pe care îl preferă (primul buton). */
export function ClientMessage({ title, text, phone, email, preferred, subject }: { title: string; text: string; phone?: string | null; email?: string | null; preferred?: string | null; subject?: string }) {
  const [copied, setCopied] = useState(false);
  const actions = channelActions({ text, phone, email, preferred, subject, wa: waPhone(phone) });
  const hint = preferredHint(preferred, { phone, email });
  const btn = "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-bold";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12.5px] font-bold text-foreground">{title}</div>
      <textarea readOnly value={text} rows={4} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-[10px] border border-[#d0d5dd] bg-[#f9fafb] px-3 py-2 text-[12.5px] leading-snug" />
      {hint && <p className="text-[12px] font-semibold text-[#475467]">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <a key={a.id} className={`${btn} ${a.preferred ? "border-electric bg-electric" : "border-border bg-white"}`} href={a.href} target={a.id === "whatsapp" ? "_blank" : undefined} rel="noreferrer">
            {a.label}{a.preferred ? " · preferat" : ""}
          </a>
        ))}
        <button type="button" className={`${btn} border-border bg-white`} onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {})}>{copied ? "Copiat" : "Copiază"}</button>
      </div>
    </div>
  );
}

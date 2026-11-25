"use client";

import { useState } from "react";
import { waPhone } from "@/lib/client-messages";

/** Un mesaj gata de trimis clientului: îl copiezi sau îl deschizi direct în WhatsApp / SMS. */
export function ClientMessage({ title, text, phone }: { title: string; text: string; phone?: string | null }) {
  const [copied, setCopied] = useState(false);
  const wa = waPhone(phone);
  const btn = "rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12.5px] font-bold";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12.5px] font-bold text-foreground">{title}</div>
      <textarea readOnly value={text} rows={4} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-[10px] border border-[#d0d5dd] bg-[#f9fafb] px-3 py-2 text-[12.5px] leading-snug" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {})}>{copied ? "Copiat" : "Copiază"}</button>
        {wa && <a className={btn} href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
        {phone && <a className={btn} href={`sms:${phone.replace(/\s/g, "")}?body=${encodeURIComponent(text)}`}>SMS</a>}
      </div>
    </div>
  );
}

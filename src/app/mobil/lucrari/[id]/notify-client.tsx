"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { waPhone } from "@/lib/client-messages";

/** „Anunță clientul”: mesajul „am plecat spre dumneavoastră”, cu linkul de status, pe WhatsApp sau SMS. */
export function NotifyClient({ text, phone }: { text: string; phone: string | null }) {
  const [copied, setCopied] = useState(false);
  const wa = waPhone(phone);
  return (
    <div className="m-cd" style={{ display: "grid", gap: 10 }}>
      <div className="m-r" style={{ gap: 10 }}>
        <span className="m-ic"><Send className="m-i" /></span>
        <div className="m-fl">
          <div style={{ fontSize: 15, fontWeight: 800 }}>Anunță clientul că ești pe drum</div>
          <div className="m-mu m-sm">Clientul primește și linkul unde vede cine vine și stadiul lucrării.</div>
        </div>
      </div>
      <div className="m-sm" style={{ background: "var(--m-input-bg, #f4f5f7)", borderRadius: 14, padding: "10px 12px", lineHeight: 1.45 }}>{text}</div>
      <div className="m-r" style={{ gap: 8 }}>
        {wa && <a className="m-btn sm" style={{ flex: "1 1 0", minWidth: 0 }} href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
        {phone && <a className="m-bt2 sm" style={{ flex: "1 1 0", minWidth: 0 }} href={`sms:${phone.replace(/\s/g, "")}?body=${encodeURIComponent(text)}`}>SMS</a>}
        <button type="button" className="m-bt2 sm" style={{ flex: "1 1 0", minWidth: 0 }} onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {})}>{copied ? "Copiat" : "Copiază"}</button>
      </div>
    </div>
  );
}

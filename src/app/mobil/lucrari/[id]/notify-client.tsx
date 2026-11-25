"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { waPhone } from "@/lib/client-messages";
import { channelActions, preferredHint } from "@/lib/contact-prefs";

/** „Anunță clientul”: mesajul „am plecat spre dumneavoastră”, cu linkul de status, pe canalul preferat de client. */
export function NotifyClient({ text, phone, preferred }: { text: string; phone: string | null; preferred?: string | null }) {
  const [copied, setCopied] = useState(false);
  // E-mailul nu ajută pe drum: rămân apelul, WhatsApp și SMS.
  const actions = channelActions({ text, phone, preferred: preferred === "email" ? null : preferred, wa: waPhone(phone) }).slice(0, 3);
  const hint = preferred === "email" ? "Clientul preferă e-mail; pe drum, un SMS ajunge mai repede." : preferredHint(preferred, { phone });
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
      {hint && <div className="m-sm" style={{ fontWeight: 700 }}>{hint}</div>}
      <div className="m-r" style={{ gap: 8 }}>
        {actions.map((a, i) => (
          <a key={a.id} className={`${i === 0 ? "m-btn" : "m-bt2"} sm`} style={{ flex: "1 1 0", minWidth: 0 }} href={a.href} target={a.id === "whatsapp" ? "_blank" : undefined} rel="noreferrer">{a.label}</a>
        ))}
        <button type="button" className="m-bt2 sm" style={{ flex: "1 1 0", minWidth: 0 }} onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {})}>{copied ? "Copiat" : "Copiază"}</button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { waPhone } from "@/lib/client-messages";
import { channelActions, preferredHint } from "@/lib/contact-prefs";

/**
 * Trimiterea raportului către client: WhatsApp, SMS, e-mail (linkul direct la PDF), „Distribuie”
 * (foaia de partajare a telefonului, cu fișierul PDF, unde există) și copierea linkului.
 */
export function ShareReport({ text, link, pdfUrl, fileName, phone, email, preferred, subject }: {
  text: string; link: string; pdfUrl: string; fileName: string; phone: string | null; email: string | null; preferred: string | null; subject: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const actions = channelActions({ text, phone, email, preferred: preferred === "telefon" ? null : preferred, subject, wa: waPhone(phone) }).filter((a) => a.id !== "telefon");
  const hint = preferred === "telefon" ? null : preferredHint(preferred, { phone, email });

  async function share() {
    setBusy(true);
    setError(null);
    try {
      // Cu fișierul atașat (WhatsApp, Mail, Salvează în Fișiere); dacă telefonul nu acceptă fișiere, doar linkul.
      let shared = false;
      try {
        const res = await fetch(pdfUrl, { credentials: "same-origin" });
        if (res.ok) {
          const file = new File([await res.blob()], fileName, { type: "application/pdf" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: subject, text });
            shared = true;
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
      if (!shared) await navigator.share({ title: subject, text, url: link });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Nu s-a putut deschide partajarea. Folosește butoanele de mai jos.");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => setError("Nu s-a putut copia. Ține apăsat pe link ca să-l copiezi."));
  }

  return (
    <div className="m-col" style={{ gap: 10 }}>
      {canShare && (
        <button type="button" className="m-btn" onClick={share} disabled={busy}>
          <Share2 className="m-i" /> {busy ? "Se pregătește…" : "Trimite raportul"}
        </button>
      )}
      {hint && <div className="m-sm" style={{ fontWeight: 700 }}>{hint}</div>}
      {actions.length > 0 && (
        <div className="m-r" style={{ gap: 8 }}>
          {actions.map((a, i) => (
            <a key={a.id} className={`${!canShare && i === 0 ? "m-btn" : "m-bt2"} sm`} style={{ flex: "1 1 0", minWidth: 0 }} href={a.href} target={a.id === "whatsapp" ? "_blank" : undefined} rel="noreferrer">
              {a.label}
            </a>
          ))}
        </div>
      )}
      <button type="button" className="m-bt2 sm" onClick={copy}>
        {copied ? <Check className="m-i" /> : <Copy className="m-i" />} {copied ? "Link copiat" : "Copiază linkul raportului"}
      </button>
      {error && <div className="m-sm" style={{ color: "var(--m-bad)", fontWeight: 700 }}>{error}</div>}
    </div>
  );
}

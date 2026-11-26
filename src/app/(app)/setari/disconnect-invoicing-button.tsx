"use client";

import { useState, useTransition } from "react";
import { Loader2, Unplug } from "lucide-react";
import { disconnectInvoicing } from "./invoicing-actions";

/** Deconectează SmartBill/Oblio, cu confirmare. Folosit în Setări și în antetul paginii Facturare. */
export function DisconnectInvoicingButton({ label, variant = "link" }: { label: string; variant?: "link" | "button" }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ error?: string; ok?: string } | null>(null);
  const onClick = () => {
    const ok = window.confirm(
      `Deconectezi ${label}?\n\nPlatforma nu mai emite și nu mai sincronizează documente cu ${label}, iar cheia API salvată se șterge. Facturile deja emise rămân în listă. Poți conecta din nou oricând din Setări → Integrări.`,
    );
    if (!ok) return;
    start(async () => setMsg(await disconnectInvoicing()));
  };
  const cls = variant === "button"
    ? "flex h-10 items-center gap-2 rounded-[11px] border border-border bg-white px-3.5 text-[13px] font-bold text-danger disabled:opacity-60"
    : "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-danger disabled:opacity-60";
  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" onClick={onClick} disabled={pending} className={cls} title={`Oprește legătura cu ${label}`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />} {pending ? "Se deconectează…" : `Deconectează ${variant === "button" ? label : ""}`.trim()}
      </button>
      {msg?.error && <span role="alert" className="max-w-[340px] text-right text-[12px] font-semibold text-danger">{msg.error}</span>}
      {msg?.ok && <span role="status" className="max-w-[340px] text-right text-[12px] font-semibold text-success">{msg.ok}</span>}
    </span>
  );
}

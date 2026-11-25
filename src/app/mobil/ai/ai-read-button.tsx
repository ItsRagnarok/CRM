"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { shrink } from "@/app/mobil/lucrari/[id]/foto/photo-capture";
import { readPlate, readReceipt } from "./actions";
import type { Plate, Receipt } from "@/lib/ai-extract";

type Props =
  | { kind: "bon"; file?: File | null; label?: string; onResult: (r: Receipt, logId: string | null) => void }
  | { kind: "placuta" | "eticheta"; file?: File | null; label?: string; onResult: (r: Plate, logId: string | null) => void };

/**
 * „Citește cu AI”: trimite poza (micșorată) și completează câmpurile. Nimic nu se salvează singur:
 * omul vede ce s-a completat, corectează și abia apoi trimite. Fără poză dată de părinte, deschide camera.
 */
export function AiReadButton(p: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function read(f: File) {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await shrink(f);
      const fd = new FormData();
      fd.set("image", new File([blob], "poza.jpg", { type: blob.type || "image/jpeg" }));
      if (p.kind === "bon") {
        const r = await readReceipt(fd);
        if ("error" in r) setMsg({ text: r.error });
        else { p.onResult(r.receipt, r.logId); setMsg({ ok: true, text: "Am completat din bon. Verifică fiecare câmp înainte să trimiți." }); }
      } else {
        fd.set("feature", p.kind);
        const r = await readPlate(fd);
        if ("error" in r) setMsg({ text: r.error });
        else { p.onResult(r.plate, r.logId); setMsg({ ok: true, text: "Am completat din plăcuță. Verifică seria literă cu literă." }); }
      }
    } catch {
      setMsg({ text: "Fără semnal sau AI indisponibil. Completează de mână." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {!p.file && <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />}
      <button
        type="button"
        className="m-bt2 sm"
        disabled={busy}
        onClick={() => (p.file ? read(p.file) : input.current?.click())}
        style={{ gap: 8 }}
      >
        <Sparkles className="m-i" style={{ width: 18, height: 18 }} /> {busy ? "Citesc…" : p.label ?? (p.kind === "bon" ? "Completează din bon (AI)" : "Citește plăcuța (AI)")}
      </button>
      {msg && <div role={msg.ok ? "status" : "alert"} className={`m-sm ${msg.ok ? "m-mu" : ""}`} style={msg.ok ? undefined : { color: "var(--m-wr)", fontWeight: 700 }}>{msg.text}</div>}
    </div>
  );
}

/** Eticheta „AI” lângă un câmp completat automat, până când omul îl modifică. */
export function AiBadge() {
  return <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, padding: "1px 6px", borderRadius: 6, background: "var(--m-ac-soft, #f0fbd3)", color: "var(--m-ink)" }}>AI · verifică</span>;
}

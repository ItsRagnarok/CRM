"use client";

import { useState } from "react";
import { Banknote, Building2, CreditCard, Send } from "lucide-react";
import { sendBillingRequest } from "./actions";

const METHODS = [
  { id: "numerar", label: "Numerar", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "transfer", label: "Transfer", icon: Building2 },
] as const;

export function BillingForm({
  jobId, jobTitle, hoursLabel, materials, expenseTotal,
}: { jobId: string; jobTitle: string; hoursLabel: string; materials: string[]; expenseTotal: number }) {
  const [method, setMethod] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form action={sendBillingRequest} onSubmit={() => setPending(true)} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="method" value={method ?? ""} />
      <div className="m-bd">
        <div className="m-cd m-col" style={{ gap: 10 }}>
          <div className="m-lb">Ce s-a făcut</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{jobTitle}</div>
          <hr className="m-sep" />
          <div className="m-r"><span className="m-fl m-mu">Timp pe lucrare</span><b>{hoursLabel}</b></div>
          {materials.length > 0 ? (
            <div>
              <div className="m-mu" style={{ marginBottom: 4 }}>Materiale folosite</div>
              {materials.map((m) => <div key={m} style={{ fontSize: 14.5, fontWeight: 600, padding: "2px 0" }}>{m}</div>)}
            </div>
          ) : (
            <div className="m-r"><span className="m-fl m-mu">Materiale folosite</span><b>—</b></div>
          )}
          {expenseTotal > 0 && <div className="m-r"><span className="m-fl m-mu">Cheltuieli trimise</span><b>{expenseTotal.toFixed(2)} lei</b></div>}
        </div>

        <div className="m-lb" style={{ marginTop: 4 }}>Ai încasat ceva la fața locului?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[{ id: "", label: "Nu", icon: null }, ...METHODS].map(({ id, label, icon: Icon }) => {
            const on = (method ?? "") === id;
            return (
              <button
                key={id || "none"}
                type="button"
                onClick={() => setMethod(id || null)}
                className="m-cd"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 4px", fontSize: 12.5, fontWeight: 700, borderRadius: 16, color: "var(--m-ink)",
                  ...(on ? { borderColor: "var(--m-ink)", boxShadow: "0 0 0 4px rgba(15,23,42,.07)" } : { borderColor: "var(--m-input-ln)", borderWidth: 1.5 }),
                }}
              >
                {Icon ? <Icon className="m-i" /> : <span style={{ height: 22, fontSize: 18, lineHeight: "22px" }}>—</span>}
                {label}
              </button>
            );
          })}
        </div>
        {method && (
          <div className="m-fld">
            <label htmlFor="amount">Sumă încasată (lei)</label>
            <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="m-in" style={{ fontSize: 20, fontWeight: 800 }} placeholder="0,00" />
          </div>
        )}
        <div className="m-fld">
          <label htmlFor="note">Mesaj pentru birou (opțional)</label>
          <textarea id="note" name="note" maxLength={500} className="m-in" placeholder="ex. Clientul cere factură pe firmă" />
        </div>
        <div className="m-note warn m-sm">
          Biroul emite factura (SmartBill/Oblio) după ce verifică lucrarea. Numerarul încasat se predă conform regulii firmei.
        </div>
      </div>
      <div className="m-ft">
        <button type="submit" className="m-btn" disabled={pending}><Send className="m-i" /> {pending ? "Se trimite…" : "Trimite la birou pentru facturare"}</button>
        <a href={`/mobil/lucrari/${jobId}/gata`} className="m-link" style={{ textAlign: "center", color: "var(--m-mu)" }}>Sar peste</a>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Camera, Fuel, MoreHorizontal, ParkingSquare, Truck, Wrench, Package } from "lucide-react";
import { submitMobileExpense } from "../actions";

const CATEGORIES = [
  { id: "combustibil", label: "Combustibil", icon: Fuel },
  { id: "materiale", label: "Materiale", icon: Package },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "parcare", label: "Parcare", icon: ParkingSquare },
  { id: "unelte", label: "Unelte", icon: Wrench },
  { id: "altele", label: "Altele", icon: MoreHorizontal },
];

export function ExpenseForm({ jobs, defaultJobId, today }: { jobs: { id: string; label: string }[]; defaultJobId: string; today: string }) {
  const [category, setCategory] = useState("combustibil");
  const [paidWith, setPaidWith] = useState<"own" | "company">("own");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (jobs.length === 0) {
    return (
      <div className="m-bd">
        <div className="m-note warn">Nu ai nicio lucrare alocată. Cheltuielile se leagă de o lucrare — cere biroului să-ți aloce una.</div>
      </div>
    );
  }

  return (
    <form action={submitMobileExpense} onSubmit={() => setPending(true)} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="paidWith" value={paidWith} />
      <div className="m-bd">
        <div>
          <div className="m-lb" style={{ marginBottom: 8 }}>Categorie</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className="m-cd"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 4px", fontSize: 12.5, fontWeight: 700,
                  borderRadius: 16, ...(category === id ? { borderColor: "var(--m-ink)", boxShadow: "0 0 0 4px rgba(15,23,42,.07)" } : { borderColor: "var(--m-input-ln)", borderWidth: 1.5 }),
                  color: "var(--m-ink)",
                }}
              >
                <Icon className="m-i" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="m-r" style={{ gap: 10 }}>
          <div className="m-fld m-fl">
            <label htmlFor="amount">Sumă (lei)</label>
            <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="m-in" style={{ fontSize: 20, fontWeight: 800 }} placeholder="0,00" />
          </div>
          <div className="m-fld m-fl">
            <label htmlFor="expenseDate">Data</label>
            <input id="expenseDate" name="expenseDate" type="date" defaultValue={today} max={today} className="m-in" />
          </div>
        </div>

        <div className="m-fld">
          <label htmlFor="vendor">Furnizor (opțional)</label>
          <input id="vendor" name="vendor" className="m-in" placeholder="ex. OMV Petrom" />
        </div>

        <div className="m-fld">
          <label htmlFor="jobId">Lucrare</label>
          <select id="jobId" name="jobId" defaultValue={defaultJobId} className="m-in">
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.label}</option>
            ))}
          </select>
        </div>

        <div className="m-fld">
          <span>Cum ai plătit?</span>
          <div style={{ display: "flex", gap: 8 }}>
            {([["own", "Din banii mei (decont)"], ["company", "Card firmă"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPaidWith(id)} className={`m-chip ${paidWith === id ? "on" : ""}`} style={{ flex: 1, justifyContent: "center", padding: "13px 8px" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="m-cd m-r" style={{ cursor: "pointer" }}>
          <span className="m-ic"><Camera className="m-i" /></span>
          <span className="m-fl">
            <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{receiptName ? "Bon adăugat" : "Fotografiază bonul"}</span>
            <span className="m-mu m-sm">{receiptName ?? "Recomandat — biroul îl cere la decont"}</span>
          </span>
          <input type="file" name="receipt" accept="image/*" capture="environment" hidden onChange={(e) => setReceiptName(e.target.files?.[0]?.name ?? null)} />
        </label>
      </div>
      <div className="m-ft">
        <button type="submit" className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Trimite cheltuiala"}</button>
      </div>
    </form>
  );
}

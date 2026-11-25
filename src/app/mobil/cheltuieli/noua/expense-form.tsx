"use client";

import { useState } from "react";
import { Camera, Fuel, MoreHorizontal, ParkingSquare, Truck, Wrench, Package } from "lucide-react";
import { submitMobileExpense } from "../actions";
import { AiBadge, AiReadButton } from "@/app/mobil/ai/ai-read-button";
import type { Receipt } from "@/lib/ai-extract";

// Categoria ghicită după furnizor (doar o propunere; omul o vede și o poate schimba).
function guessCategory(vendor: string | null) {
  const v = (vendor ?? "").toLowerCase();
  if (/omv|petrom|rompetrol|lukoil|mol\b|socar|gazprom|benzin/.test(v)) return "combustibil";
  if (/dedeman|hornbach|leroy|brico|arabesque|electric|sanitar|instal|mathaus|praktiker/.test(v)) return "materiale";
  if (/parcar|parking/.test(v)) return "parcare";
  return null;
}

const CATEGORIES = [
  { id: "combustibil", label: "Combustibil", icon: Fuel },
  { id: "materiale", label: "Materiale", icon: Package },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "parcare", label: "Parcare", icon: ParkingSquare },
  { id: "unelte", label: "Unelte", icon: Wrench },
  { id: "altele", label: "Altele", icon: MoreHorizontal },
];

export function ExpenseForm({ jobs, defaultJobId, today, aiEnabled = false }: { jobs: { id: string; label: string }[]; defaultJobId: string; today: string; aiEnabled?: boolean }) {
  const [category, setCategory] = useState("combustibil");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [vendor, setVendor] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ai, setAi] = useState<{ logId: string | null; suggested: Record<string, unknown>; items: Receipt["articole"] } | null>(null);
  const fromAi = (key: string, value: unknown) => ai !== null && ai.suggested[key] !== undefined && ai.suggested[key] !== null && String(ai.suggested[key]) === String(value);
  const applyReceipt = (r: Receipt, logId: string | null) => {
    const cat = guessCategory(r.furnizor);
    const suggested: Record<string, unknown> = { amount: r.total !== null ? r.total.toFixed(2) : null, date: r.data, vendor: r.furnizor, category: cat };
    if (r.total !== null) setAmount(r.total.toFixed(2));
    if (r.data) setDate(r.data);
    if (r.furnizor) setVendor(r.furnizor);
    if (cat) setCategory(cat);
    setAi({ logId, suggested, items: r.articole });
  };
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
      {ai && <input type="hidden" name="aiLogId" value={ai.logId ?? ""} />}
      {ai && <input type="hidden" name="aiSuggested" value={JSON.stringify(ai.suggested)} />}
      {ai && ai.items.length > 0 && <input type="hidden" name="items" value={JSON.stringify(ai.items.map((i) => ({ name: i.denumire, qty: i.cantitate, total: i.pret_total })))} />}
      <div className="m-bd">
        <label className="m-cd m-r" style={{ cursor: "pointer" }}>
          <span className="m-ic"><Camera className="m-i" /></span>
          <span className="m-fl">
            <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{receiptName ? "Bon adăugat" : "Fotografiază bonul"}</span>
            <span className="m-mu m-sm">{receiptName ?? (aiEnabled ? "Întâi poza: AI-ul îți completează suma, data și furnizorul" : "Recomandat — biroul îl cere la decont")}</span>
          </span>
          <input type="file" name="receipt" accept="image/*" capture="environment" hidden onChange={(e) => { setReceiptName(e.target.files?.[0]?.name ?? null); setReceiptFile(e.target.files?.[0] ?? null); }} />
        </label>
        {aiEnabled && receiptFile && <AiReadButton kind="bon" file={receiptFile} onResult={applyReceipt} />}
        {ai && ai.items.length > 0 && (
          <div className="m-mu m-sm">Articole citite: {ai.items.slice(0, 6).map((i) => i.denumire).join(", ")}{ai.items.length > 6 ? ` și încă ${ai.items.length - 6}` : ""}.</div>
        )}
        <div>
          <div className="m-lb" style={{ marginBottom: 8 }}>Categorie{fromAi("category", category) && <AiBadge />}</div>
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
            <label htmlFor="amount">Sumă (lei){fromAi("amount", amount) && <AiBadge />}</label>
            <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="m-in" style={{ fontSize: 20, fontWeight: 800 }} placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="m-fld m-fl">
            <label htmlFor="expenseDate">Data{fromAi("date", date) && <AiBadge />}</label>
            <input id="expenseDate" name="expenseDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} className="m-in" />
          </div>
        </div>

        <div className="m-fld">
          <label htmlFor="vendor">Furnizor (opțional){fromAi("vendor", vendor) && <AiBadge />}</label>
          <input id="vendor" name="vendor" className="m-in" placeholder="ex. OMV Petrom" value={vendor} onChange={(e) => setVendor(e.target.value)} />
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

      </div>
      <div className="m-ft">
        <button type="submit" className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Trimite cheltuiala"}</button>
      </div>
    </form>
  );
}

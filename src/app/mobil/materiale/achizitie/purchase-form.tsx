"use client";

import { useActionState, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { submitUrgentPurchase } from "./actions";
import { AiBadge, AiReadButton } from "@/app/mobil/ai/ai-read-button";
import type { Receipt } from "@/lib/ai-extract";

type Material = { id: string; name: string; unit: string };
type Row = { key: number; name: string; qty: string };

export function PurchaseForm({ jobs, defaultJobId, materials, aiEnabled = false }: { jobs: { id: string; label: string }[]; defaultJobId: string; materials: Material[]; aiEnabled?: boolean }) {
  const [state, action, pending] = useActionState(submitUrgentPurchase, undefined);
  const [rows, setRows] = useState<Row[]>([{ key: 1, name: "", qty: "1" }]);
  const [paidWith, setPaidWith] = useState<"own" | "company">("own");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [ai, setAi] = useState<{ logId: string | null; suggested: Record<string, unknown> } | null>(null);
  const applyReceipt = (r: Receipt, logId: string | null) => {
    if (r.total !== null) setAmount(r.total.toFixed(2));
    if (r.furnizor) setVendor(r.furnizor);
    if (r.articole.length) setRows(r.articole.map((a, i) => ({ key: Date.now() + i, name: a.denumire, qty: String(a.cantitate ?? 1).replace(".", ",") })));
    setAi({ logId, suggested: { amount: r.total !== null ? r.total.toFixed(2) : null, vendor: r.furnizor, items: r.articole.map((a) => a.denumire).join("|") || null } });
  };
  const byName = new Map(materials.map((m) => [m.name.toLocaleLowerCase("ro-RO"), m]));
  const set = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  if (jobs.length === 0) {
    return <div className="m-bd"><div className="m-note warn">Nu ai nicio lucrare alocată. Achiziția se leagă de o lucrare: cere biroului să-ți aloce una.</div></div>;
  }

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="paidWith" value={paidWith} />
      {ai && <input type="hidden" name="aiLogId" value={ai.logId ?? ""} />}
      {ai && <input type="hidden" name="aiSuggested" value={JSON.stringify(ai.suggested)} />}
      <datalist id="catalog">{materials.map((m) => <option key={m.id} value={m.name} />)}</datalist>
      <div className="m-bd">
        <label className="m-cd m-r" style={{ cursor: "pointer", ...(receiptName ? { borderColor: "var(--m-ink)" } : {}) }}>
          <span className="m-ic"><Camera className="m-i" /></span>
          <span className="m-fl">
            <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{receiptName ? "Bon fotografiat" : "Fotografiază bonul"}</span>
            <span className="m-mu m-sm">{receiptName ?? "Obligatoriu: fără bon, biroul nu poate deconta"}</span>
          </span>
          <input type="file" name="receipt" accept="image/*" capture="environment" hidden onChange={(e) => { setReceiptName(e.target.files?.[0]?.name ?? null); setReceiptFile(e.target.files?.[0] ?? null); }} />
        </label>
        {aiEnabled && receiptFile && <AiReadButton kind="bon" file={receiptFile} label="Completează articolele din bon (AI)" onResult={applyReceipt} />}

        <div className="m-fld">
          <label htmlFor="jobId">Pentru lucrarea</label>
          <select id="jobId" name="jobId" defaultValue={defaultJobId} className="m-in">
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
        </div>

        <div>
          <div className="m-lb" style={{ marginBottom: 8 }}>Ce ai cumpărat{ai && <AiBadge />}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => {
              const m = byName.get(r.name.trim().toLocaleLowerCase("ro-RO"));
              return (
                <div key={r.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="hidden" name="itemMaterialId" value={m?.id ?? ""} />
                  <input type="hidden" name="itemUnit" value={m?.unit ?? ""} />
                  <input name="itemName" list="catalog" value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} placeholder="ex. Siguranță automată 10A" className="m-in" style={{ flex: 1, minWidth: 0 }} />
                  <input name="itemQty" value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} inputMode="decimal" aria-label="Cantitate" className="m-in" style={{ width: 64, textAlign: "center" }} />
                  {rows.length > 1 && (
                    <button type="button" aria-label="Șterge rândul" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} className="m-ic" style={{ border: 0 }}><X className="m-i" /></button>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setRows((x) => [...x, { key: Date.now(), name: "", qty: "1" }])} className="m-chip" style={{ alignSelf: "flex-start" }}>
              <Plus className="m-i" style={{ width: 16, height: 16 }} /> Încă un articol
            </button>
          </div>
        </div>

        <div className="m-r" style={{ gap: 10 }}>
          <div className="m-fld m-fl">
            <label htmlFor="amount">Total bon (lei){ai && ai.suggested.amount !== null && amount === ai.suggested.amount && <AiBadge />}</label>
            <input id="amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required className="m-in" style={{ fontSize: 20, fontWeight: 800 }} placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="m-fld m-fl">
            <label htmlFor="vendor">Magazin</label>
            <input id="vendor" name="vendor" className="m-in" placeholder="ex. Dedeman" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>
        </div>

        <div className="m-fld">
          <span>Cum ai plătit?</span>
          <div style={{ display: "flex", gap: 8 }}>
            {([["own", "Din banii mei (decont)"], ["company", "Card firmă"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setPaidWith(id)} className={`m-chip ${paidWith === id ? "on" : ""}`} style={{ flex: 1, justifyContent: "center", padding: "13px 8px" }}>{label}</button>
            ))}
          </div>
        </div>
        {state?.error && <div role="alert" className="m-note warn">{state.error}</div>}
      </div>
      <div className="m-ft">
        <button type="submit" className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Trimite la birou"}</button>
      </div>
    </form>
  );
}

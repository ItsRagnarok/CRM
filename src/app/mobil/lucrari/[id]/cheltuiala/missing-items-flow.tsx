"use client";

import { useState } from "react";
import { advanceMobileStage } from "../actions";

type Expense = {
  id: string;
  category: string;
  vendor: string | null;
  amount: number;
  receipt_path: string | null;
  created_at: string;
};

const CATEGORIES = ["materiale", "combustibil", "parcare", "unelte"];
const CATEGORY_LABELS: Record<string, string> = {
  materiale: "Materiale",
  combustibil: "Combustibil",
  parcare: "Parcare",
  unelte: "Unelte",
};

export function MissingItemsFlow({
  jobId,
  expenses,
  addExpense,
}: {
  jobId: string;
  expenses: Expense[];
  addExpense: (formData: FormData) => void | Promise<void>;
}) {
  const [showForm, setShowForm] = useState(expenses.length > 0);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  if (!showForm) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="text-[16px] font-extrabold text-foreground">
          Îți lipsește vreun material sau sculă pentru lucrarea asta?
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
          >
            DA, ÎMI LIPSEȘTE CEVA
          </button>
          <form action={advanceMobileStage}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="stage" value="ready" />
            <button
              type="submit"
              className="block w-full rounded-[12px] bg-neutral-bg py-[14px] text-center text-[14.5px] font-extrabold text-[#344054]"
            >
              NU, AM TOT CE-MI TREBUIE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-4 mt-3 rounded-[10px] bg-electric-soft px-3.5 py-2.5 text-[12px] leading-snug text-electric">
        Cere acordul pentru cumpărare adăugând cheltuiala aici — magazin, sumă, categorie și bonul. Poți adăuga mai
        multe cheltuieli (materiale, combustibil etc.) înainte de a continua.
      </div>

      {expenses.length > 0 && (
        <div className="mx-4 mt-3 flex flex-col gap-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-[10px] border border-[#eaecf0] bg-white px-3.5 py-2.5"
            >
              <div>
                <div className="text-[13px] font-bold text-[#344054]">
                  {CATEGORY_LABELS[e.category] ?? e.category}
                  {e.vendor ? ` · ${e.vendor}` : ""}
                </div>
                {e.receipt_path && <div className="text-[11px] text-success">Bon atașat</div>}
              </div>
              <div className="text-[13.5px] font-extrabold text-foreground">{Number(e.amount).toFixed(2)} RON</div>
            </div>
          ))}
          <div className="flex justify-end px-1 text-[12px] font-bold text-muted-2">Total: {total.toFixed(2)} RON</div>
        </div>
      )}

      <form action={addExpense} className="flex flex-col p-4">
        <input type="hidden" name="jobId" value={jobId} />

        <Field label="Magazin / furnizor">
          <input
            name="vendor"
            placeholder="Ex: Leroy Merlin"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-electric"
          />
        </Field>

        <Field label="Sumă (RON)">
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] font-bold outline-none focus:border-electric"
          />
        </Field>

        <div className="mt-1">
          <div className="mb-2 text-[12px] font-semibold text-[#344054]">Categorie</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="category" value={c} defaultChecked={i === 0} className="peer sr-only" />
                <span className="rounded-full bg-neutral-bg px-3.5 py-2 text-[12.5px] font-semibold text-[#475467] peer-checked:bg-electric peer-checked:text-white">
                  {CATEGORY_LABELS[c]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Field label="Bon / factură">
          <input
            name="receipt"
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="w-full text-[13px]"
          />
        </Field>

        <button
          type="submit"
          className="mt-2 block w-full rounded-[12px] bg-electric py-[14px] text-center text-[14.5px] font-extrabold text-white"
        >
          ADAUGĂ CHELTUIALA
        </button>
      </form>

      <div className="flex-shrink-0 border-t border-[#eaecf0] p-4">
        <form action={advanceMobileStage}>
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="stage" value="ready" />
          <button
            type="submit"
            className="block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)]"
          >
            CONTINUĂ
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[12px] font-semibold text-[#344054]">{label}</div>
      {children}
    </div>
  );
}

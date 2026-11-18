"use client";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { saveInvoice, searchClients } from "../invoice-actions";
import { QuickClient } from "../workflow-forms";
import { card, primary, secondary } from "../ui";
import { input } from "../forms";
import { preview, money } from "@/lib/billing/money";
import type { EditLine } from "@/lib/billing/types";
type Client = { id: string; name: string | null; cui: string | null };
export function InvoiceEditor({
  id,
  clients,
  series,
  defaultClient,
  kind,
  date,
  due,
  vat,
  notes = "",
  initialLines,
  initialSeries,
  connected,
}: {
  id: string;
  clients: Client[];
  series: { id: string; name: string }[];
  defaultClient?: string;
  kind: string;
  date: string;
  due: string;
  vat: string;
  notes?: string;
  initialLines?: EditLine[];
  initialSeries?: string | null;
  connected: boolean;
}) {
  const intentRef = useRef<HTMLInputElement>(null);
  const [state, submit, pending] = useActionState(saveInvoice, undefined);
  const [lines, setLines] = useState<EditLine[]>(
    initialLines ?? [
      { name: "", unit: "buc", service: true, quantity: "1", price: "", vat },
    ],
  );
  const [editing, setEditing] = useState(initialLines ? -1 : 0);
  const [clientId, setClient] = useState(defaultClient ?? "");
  const [options, setOptions] = useState(clients);
  const [q, setQ] = useState("");
  const [searching, startSearch] = useTransition();
  const [searchError, setSearchError] = useState("");
  const [send, setSend] = useState(true);
  const [issueDate, setDate] = useState(date);
  const [dueDate, setDue] = useState(due);
  let totals = { subtotal: "0.00", vat: "0.00", total: "0.00" };
  let valid = true;
  try {
    totals = preview(lines.map((l) => ({ ...l, price: l.price || "0" })));
  } catch {
    valid = false;
  }
  function change(index: number, key: keyof EditLine, value: string | boolean) {
    setLines((old) =>
      old.map((l, i) => (i === index ? { ...l, [key]: value } : l)),
    );
  }
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/admin/facturare/facturi" aria-label="Înapoi la facturi">
          <ArrowLeft />
        </Link>
        <h1 className="text-2xl font-extrabold">
          {kind === "proforma" ? "Proformă nouă" : "Factură nouă"}
        </h1>
        <span className="ml-auto rounded-lg bg-neutral-bg px-3 py-1.5 text-xs text-muted">
          Număr la emitere
        </span>
      </header>
      {!connected && (
        <Link
          className="block rounded-xl bg-amber-soft p-4 text-sm font-semibold"
          href="/admin/facturare/setari#oblio"
        >
          Conectează Oblio în Setări pentru a emite. Poți salva o ciornă.
        </Link>
      )}
      <section className={card}>
        <h2 className="mb-4 text-xs font-bold uppercase text-muted">Client</h2>
        <div className="mb-3 flex gap-2">
          <input
            aria-label="Caută client după nume sau CUI"
            className={input + " mt-0"}
            placeholder="Alt client sau caută după CUI"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            disabled={searching}
            aria-label="Caută client"
            className={secondary}
            onClick={() =>
              startSearch(async () => {
                try {
                  const rows = await searchClients(q);
                  setOptions(rows);
                  setSearchError("");
                } catch {
                  setSearchError("Căutarea nu a reușit. Reîncearcă.");
                }
              })
            }
          >
            <Search size={18} />
          </button>
        </div>
        {searchError && (
          <p role="alert" className="text-sm text-danger">
            {searchError}
          </p>
        )}
        <label className="text-sm font-semibold">
          Clientul facturii
          <select
            className={input}
            value={clientId}
            onChange={(e) => setClient(e.target.value)}
          >
            <option value="">Alege clientul</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? "Client de completat"}
                {c.cui ? " · " + c.cui : ""}
              </option>
            ))}
          </select>
        </label>
        {clientId && (
          <Link
            href={`/admin/facturare/clienti/${clientId}`}
            className="mt-3 inline-block text-sm font-semibold text-purple"
          >
            Verifică / completează datele clientului →
          </Link>
        )}
        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-purple">
            Adaugă client doar cu CUI
          </summary>
          <div className="mt-3">
            <QuickClient />
          </div>
        </details>
      </section>
      <form action={submit} className="space-y-5">
        <input type="hidden" name="id" value={state?.invoiceId ?? id} />
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="kind" value={kind} />
        <input
          type="hidden"
          name="intent"
          defaultValue="draft"
          ref={intentRef}
        />
        <input type="hidden" name="lines" value={JSON.stringify(lines)} />
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
          <section className={card}>
            <h2 className="mb-4 text-xs font-bold uppercase text-muted">
              Produse și servicii
            </h2>
            <div className="divide-y divide-border">
              {lines.map((l, i) => (
                <div key={i} className="space-y-3 py-4 first:pt-0">
                  {editing !== i ? (
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span>
                        <strong className="block">
                          {l.name || "Produs / serviciu"}
                        </strong>
                        <span className="text-sm text-muted">
                          {l.quantity} {l.unit} × {l.price || "0"} lei · TVA{" "}
                          {l.vat}%
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-purple">
                        Editează
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`Denumire linia ${i + 1}`}
                          required
                          maxLength={300}
                          placeholder="Produs sau serviciu"
                          className={input + " mt-0 font-semibold"}
                          value={l.name}
                          onChange={(e) => change(i, "name", e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label={`Șterge linia ${i + 1}`}
                          disabled={lines.length === 1}
                          className="p-2 text-muted disabled:opacity-30"
                          onClick={() =>
                            setLines(lines.filter((_, j) => j !== i))
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(
                          [
                            { key: "quantity", label: "Cantitate" },
                            { key: "unit", label: "U.M." },
                            { key: "price", label: "Preț fără TVA (lei)" },
                            { key: "vat", label: "TVA (%)" },
                          ] as const
                        ).map(({ key, label }) => (
                          <label key={key} className="text-xs text-muted">
                            {label}
                            <input
                              aria-label={`${label}, linia ${i + 1}`}
                              required
                              inputMode={key === "unit" ? "text" : "decimal"}
                              className={input}
                              value={l[key]}
                              onChange={(e) =>
                                change(i, key, e.target.value.replace(",", "."))
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={l.service}
                          onChange={(e) =>
                            change(i, "service", e.target.checked)
                          }
                        />
                        Serviciu
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (l.name && l.price) setEditing(-1);
                        }}
                        className="text-sm font-semibold text-purple"
                      >
                        Gata, păstrează linia
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={lines.length >= 100}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted p-3 font-semibold text-purple"
              onClick={() => {
                setEditing(lines.length);
                setLines([
                  ...lines,
                  {
                    name: "",
                    unit: "buc",
                    service: true,
                    quantity: "1",
                    price: "",
                    vat,
                  },
                ]);
              }}
            >
              <Plus size={18} />
              Adaugă produs sau serviciu
            </button>
          </section>
          <div className="grid grid-cols-2 gap-3">
            <label className={card + " text-sm text-muted"}>
              Data
              <input
                name="date"
                type="date"
                className={input}
                value={issueDate}
                required
                onChange={(e) => {
                  setDate(e.target.value);
                  if (e.target.value > dueDate) setDue(e.target.value);
                }}
              />
            </label>
            <label className={card + " text-sm text-muted"}>
              Scadență
              <input
                name="due"
                type="date"
                min={issueDate}
                className={input}
                value={dueDate}
                required
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
          </div>
          <section className={card}>
            <label className="text-sm font-semibold">
              Seria din Oblio
              <select
                name="seriesId"
                className={input}
                required={connected}
                defaultValue={initialSeries ?? series[0]?.id ?? ""}
              >
                <option value="">Alege seria</option>
                {series.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-muted">
              Mențiuni
              <textarea
                name="notes"
                maxLength={2000}
                defaultValue={notes}
                className={input}
                rows={2}
              />
            </label>
          </section>
          <section className={card}>
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm text-muted">
              <span>TVA</span>
              <span>{money(totals.vat)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-bold">Total de plată</span>
              <strong className="text-2xl">{money(totals.total)}</strong>
            </div>
            {!valid && (
              <p role="alert" className="mt-3 text-sm text-danger">
                Verifică valorile numerice (maximum 4 zecimale, TVA maximum 2).
              </p>
            )}
          </section>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sendEmail"
              checked={send}
              onChange={(e) => setSend(e.target.checked)}
            />
            Solicită trimiterea prin e-mail din Oblio la emitere
          </label>
          {state?.error && (
            <div role="alert" className="rounded-xl bg-amber-soft p-4 text-sm">
              <p>{state.error}</p>
              {state.invoiceId && (
                <Link
                  href={`/admin/facturare/facturi/${state.invoiceId}`}
                  className="mt-2 inline-block font-bold text-purple"
                >
                  Deschide documentul salvat →
                </Link>
              )}
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={() => {
                if (intentRef.current) intentRef.current.value = "issue";
              }}
              disabled={
                pending ||
                !valid ||
                !connected ||
                !clientId ||
                !!state?.invoiceId
              }
              className={primary + " w-full py-4 text-base"}
            >
              {pending
                ? "Se procesează…"
                : send
                  ? "Emite și trimite"
                  : "Emite fără e-mail"}
            </button>
            <button
              onClick={() => {
                if (intentRef.current) intentRef.current.value = "draft";
              }}
              disabled={pending || !valid || !clientId || !!state?.invoiceId}
              className="w-full py-3 font-semibold text-muted"
            >
              Salvează ca ciornă
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

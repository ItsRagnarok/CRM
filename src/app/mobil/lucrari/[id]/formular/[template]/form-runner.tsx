"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { saveJobForm } from "../actions";
import type { FieldDef, FormTemplate } from "@/lib/forms/templates";

type Row = Record<string, string>;
type Data = Record<string, unknown>;

function Field({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: string | boolean) => void }) {
  const id = `f-${def.key}`;
  if (def.type === "yesno") {
    return (
      <div className="m-fld">
        <span>{def.label}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange(v)}
              className="m-chip"
              style={{
                flex: 1, justifyContent: "center", padding: "13px 8px", fontSize: 15, fontWeight: 800,
                ...(value === v ? (v ? { background: "var(--m-ok-bg)", borderColor: "#86d39a", color: "var(--m-ok)" } : { background: "var(--m-bad-bg)", borderColor: "#f0a3a3", color: "var(--m-bad)" }) : {}),
              }}
            >
              {v ? "Da" : "Nu"}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (def.type === "choice") {
    return (
      <div className="m-fld">
        <span>{def.label}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {def.options!.map((o) => {
            const on = value === o.value;
            const good = o.value === "conform";
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className="m-chip"
                style={{
                  flex: 1, justifyContent: "center", padding: "15px 8px", fontSize: 15.5, fontWeight: 800,
                  ...(on ? (good ? { background: "var(--m-ok-bg)", borderColor: "#86d39a", color: "var(--m-ok)" } : { background: "var(--m-bad-bg)", borderColor: "#f0a3a3", color: "var(--m-bad)" }) : {}),
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (def.type === "textarea") {
    return (
      <div className="m-fld">
        <label htmlFor={id}>{def.label}</label>
        <textarea id={id} className="m-in" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className="m-fld">
      <label htmlFor={id}>{def.label}{def.required ? "" : " (opțional)"}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          className="m-in"
          type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"}
          inputMode={def.type === "number" ? "decimal" : undefined}
          step={def.type === "number" ? "any" : undefined}
          placeholder={def.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          style={def.unit ? { paddingRight: 64 } : undefined}
        />
        {def.unit && <span style={{ position: "absolute", right: 14, top: 0, bottom: 0, display: "flex", alignItems: "center", color: "var(--m-mu)", fontWeight: 700, fontSize: 14 }}>{def.unit}</span>}
      </div>
      {def.hint && <div className="m-mu" style={{ fontSize: 12.5 }}>{def.hint}</div>}
    </div>
  );
}

export function FormRunner({
  jobId, jobLabel, template, initialData, alreadyCompleted,
}: { jobId: string; jobLabel: string; template: FormTemplate; initialData: Data; alreadyCompleted: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initialData);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const current = template.steps[step];
  const last = step === template.steps.length - 1;
  const set = (key: string, v: unknown) => setData((d) => ({ ...d, [key]: v }));

  const rep = current.repeater;
  const rows: Row[] = rep ? (Array.isArray(data[rep.key]) ? (data[rep.key] as Row[]) : Array.from({ length: rep.min }, () => ({}))) : [];
  const setRow = (i: number, key: string, v: string) => set(rep!.key, rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  // Pressure drop is shown to the technician as information, never as a verdict.
  const drop =
    template.id === "gaze_etanseitate" && current.title === "Probă" &&
    data.presiune_inceput !== undefined && data.presiune_final !== undefined && data.presiune_inceput !== "" && data.presiune_final !== ""
      ? Number(data.presiune_inceput) - Number(data.presiune_final)
      : null;

  async function persist(payload: Data, complete: boolean) {
    setBusy(true);
    setError(null);
    const result = await saveJobForm(jobId, template.id, payload, complete);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      setMissing(result.missing ?? []);
      return false;
    }
    setMissing([]);
    return true;
  }

  async function next() {
    // Rows shown on screen but never edited still count (e.g. an untouched first row).
    const payload = rep && !Array.isArray(data[rep.key]) ? { ...data, [rep.key]: rows } : data;
    if (payload !== data) setData(payload);
    if (last) {
      if (await persist(payload, true)) router.push(`/mobil/lucrari/${jobId}`);
    } else {
      await persist(payload, false);
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="m-hd">
        <Link href={`/mobil/lucrari/${jobId}`} aria-label="Închide" className="m-ib sm"><ChevronLeft className="m-i" /></Link>
        <div className="m-fl">
          <div className="m-lb" style={{ color: "var(--m-aci)" }}>{template.label} · pasul {step + 1} din {template.steps.length}</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{current.title}</div>
        </div>
      </header>
      <div style={{ padding: "0 20px 6px", display: "flex", gap: 5 }}>
        {template.steps.map((_, i) => (
          <i key={i} style={{ flex: 1, height: 6, borderRadius: 3, display: "block", background: i < step ? "var(--m-ac)" : i === step ? "var(--m-dark)" : "var(--m-chip)" }} />
        ))}
      </div>

      <div className="m-bd">
        {alreadyCompleted && step === 0 && <div className="m-note ac m-sm">Acest formular a fost deja completat. Dacă îl salvezi din nou, valorile se actualizează.</div>}
        <div className="m-cd m-col" style={{ gap: 14 }}>
          <div className="m-mu m-sm" style={{ marginTop: -4 }}>{jobLabel}</div>
          {(current.fields ?? []).map((f) => (
            <Field key={f.key} def={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
          ))}
          {rep && (
            <>
              {rows.map((row, i) => (
                <div key={i} className="m-col" style={{ gap: 12, paddingTop: i > 0 ? 14 : 0, borderTop: i > 0 ? "1px solid var(--m-ln)" : "none" }}>
                  <div className="m-r">
                    <div className="m-lb m-fl">{rep.itemLabel} {i + 1}</div>
                    {rows.length > rep.min && (
                      <button type="button" aria-label={`Șterge ${rep.itemLabel} ${i + 1}`} className="m-link" onClick={() => set(rep.key, rows.filter((_, idx) => idx !== i))}>
                        <Trash2 className="m-i" style={{ width: 18, height: 18 }} />
                      </button>
                    )}
                  </div>
                  {rep.fields.map((f) => (
                    <Field key={f.key} def={{ ...f, key: `${rep.key}-${i}-${f.key}` }} value={row[f.key]} onChange={(v) => setRow(i, f.key, String(v))} />
                  ))}
                </div>
              ))}
              {rows.length < rep.max && (
                <button type="button" className="m-bt2 sm" onClick={() => set(rep.key, [...rows, {}])}>
                  <Plus className="m-i" style={{ width: 18, height: 18 }} /> {rep.addLabel}
                </button>
              )}
            </>
          )}
        </div>

        {drop !== null && Number.isFinite(drop) && (
          <div className={`m-note ${drop > 0 ? "warn" : ""}`} style={drop <= 0 ? { background: "var(--m-ok-bg)", borderColor: "#86d39a", color: "var(--m-ok)" } : undefined}>
            <div className="m-fl" style={{ fontWeight: 800 }}>
              {drop <= 0 ? "Nicio scădere de presiune" : `Scădere de presiune: ${drop} mbar`}
              <div className="m-sm" style={{ fontWeight: 500 }}>Doar informativ. Rezultatul îl stabilești tu, la pasul următor, conform normativului.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="m-note bad" role="alert">
            <div className="m-fl" style={{ fontWeight: 700, color: "var(--m-bad)" }}>
              {error}
              {missing.length > 0 && <ul style={{ margin: "6px 0 0 18px", fontWeight: 500, fontSize: 13 }}>{missing.slice(0, 8).map((m) => <li key={m}>{m}</li>)}</ul>}
            </div>
          </div>
        )}
      </div>

      <div className="m-ft">
        <button type="button" className="m-btn" disabled={busy} onClick={next}>
          {busy ? "Se salvează…" : last ? "Salvează formularul" : "Continuă"}
        </button>
        {step > 0 && <button type="button" className="m-link" style={{ textAlign: "center", color: "var(--m-mu)" }} onClick={() => setStep((s) => s - 1)}>Înapoi</button>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Eraser, Plus, ScanLine, Trash2 } from "lucide-react";
import { isFieldVisible, missingRequired, type FieldDef, type FormTemplate, type OpsValue } from "@/lib/forms/templates";
import { runOrQueue } from "@/lib/offline/send";
import type { QueuedOp } from "@/lib/offline/queue";
import { expectedStringVoc, parseSerials } from "@/lib/forms/pv";
import { AiBadge, AiReadButton } from "@/app/mobil/ai/ai-read-button";
import { brandModel, type Plate } from "@/lib/ai-extract";

type Detector = { detect: (src: ImageBitmap) => Promise<{ rawValue: string }[]> };

/**
 * Citește codul de bare / QR de pe etichetă dintr-o poză (BarcodeDetector, prezent în Chrome pe
 * Android). Unde nu există, tehnicianul scrie seria de mână.
 */
function ScanButton({ onResult }: { onResult: (values: string[]) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Detectăm suportul după montare: pe server nu există window, iar un buton apărut doar pe
  // client ar strica hidratarea paginii.
  const [Ctor, setCtor] = useState<(new () => Detector) | null>(null);
  useEffect(() => {
    const C = (window as unknown as { BarcodeDetector?: new () => Detector }).BarcodeDetector;
    if (C) setCtor(() => C);
  }, []);
  if (!Ctor) return null;
  return (
    <div className="m-col" style={{ gap: 4 }}>
      <label className="m-pl" style={{ alignSelf: "flex-start", cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" }}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setMsg(null);
            try {
              const bmp = await createImageBitmap(file);
              const codes = await new Ctor().detect(bmp);
              bmp.close?.();
              const values = [...new Set(codes.map((c) => c.rawValue.trim()).filter(Boolean))];
              if (values.length) { onResult(values); setMsg(values.length === 1 ? `Citit: ${values[0]}` : `${values.length} coduri citite`); }
              else setMsg("Nu am găsit niciun cod în poză. Apropie camera de etichetă sau scrie seria.");
            } catch {
              setMsg("Nu am putut citi poza. Scrie seria de mână.");
            } finally {
              setBusy(false);
            }
          }}
        />
        <ScanLine style={{ width: 15, height: 15 }} /> {busy ? "Citesc…" : "Scanează eticheta"}
      </label>
      {msg && <div className="m-mu" style={{ fontSize: 12.5 }}>{msg}</div>}
    </div>
  );
}

type Row = Record<string, string>;
type Data = Record<string, unknown>;

const OPS_CHOICES = [
  { v: "da", label: "Da" },
  { v: "nu", label: "Nu" },
  { v: "nc", label: "Nu e cazul" },
] as const;

/** Operațiunile fișei: da / nu / nu e cazul, cu motiv obligatoriu la „Nu”. */
function OpsField({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: OpsValue) => void }) {
  const ops = (value ?? {}) as OpsValue;
  const set = (n: string, patch: { v?: "da" | "nu" | "nc"; j?: string }) => onChange({ ...ops, [n]: { ...ops[n], ...patch } });
  const items = def.items ?? [];
  const done = items.filter((_, i) => ops[String(i + 1)]?.v).length;
  return (
    <div className="m-col" style={{ gap: 12 }}>
      <div className="m-r" style={{ gap: 8 }}>
        <span className="m-mu m-sm m-fl">{done} din {items.length} completate. {def.hint}</span>
        <button
          type="button"
          className="m-pl"
          onClick={() => onChange(Object.fromEntries(items.map((_, i) => [String(i + 1), ops[String(i + 1)]?.v ? ops[String(i + 1)] : { v: "da" as const }])))}
        >
          Restul: Da
        </button>
      </div>
      {items.map((text, i) => {
        const n = String(i + 1);
        const cur = ops[n];
        return (
          <div key={n} className="m-col" style={{ gap: 8, paddingTop: i ? 12 : 0, borderTop: i ? "1px solid var(--m-ln)" : "none" }}>
            <div style={{ fontSize: 14, lineHeight: 1.4 }}><b>{n}.</b> {text}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {OPS_CHOICES.map((c) => {
                const on = cur?.v === c.v;
                const tone = c.v === "da" ? { background: "var(--m-ok-bg)", borderColor: "#86d39a", color: "var(--m-ok)" } : c.v === "nu" ? { background: "var(--m-bad-bg)", borderColor: "#f0a3a3", color: "var(--m-bad)" } : { background: "var(--m-chip)", borderColor: "var(--m-mu)", color: "var(--m-tx, inherit)" };
                return (
                  <button key={c.v} type="button" aria-pressed={on} onClick={() => set(n, { v: c.v })} className="m-chip" style={{ flex: 1, justifyContent: "center", padding: "11px 4px", fontSize: 14, fontWeight: 800, ...(on ? tone : {}) }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
            {cur?.v === "nu" && (
              <input className="m-in" aria-label={`Motivul pentru operațiunea ${n}`} placeholder="De ce nu s-a efectuat (obligatoriu)" value={cur.j ?? ""} onChange={(e) => set(n, { j: e.target.value })} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Semnătură desenată pe ecran, păstrată ca imagine mică (PNG) în fișă. */
function SignatureField({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const signed = typeof value === "string" && value.startsWith("data:image/");
  useEffect(() => {
    const c = ref.current;
    if (!c || signed) return;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width);
    c.height = Math.round(rect.height);
  }, [signed]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function finish() {
    drawing.current = false;
    last.current = null;
    const c = ref.current;
    if (c) onChange(c.toDataURL("image/png"));
  }
  return (
    <div className="m-fld">
      <span>{def.label}{def.required ? "" : " (opțional)"}</span>
      {signed ? (
        <div className="m-col" style={{ gap: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value as string} alt={def.label} style={{ height: 110, width: "100%", objectFit: "contain", background: "#fff", borderRadius: 12, border: "1px solid var(--m-ln)" }} />
          <button type="button" className="m-link m-sm" style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--m-mu)" }} onClick={() => onChange("")}>
            <Eraser style={{ width: 15, height: 15 }} /> Semnează din nou
          </button>
        </div>
      ) : (
        <canvas
          ref={ref}
          aria-label={def.label}
          style={{ height: 150, width: "100%", background: "#fff", borderRadius: 12, border: "1.5px dashed var(--m-ln)", touchAction: "none" }}
          onPointerDown={(e) => { e.preventDefault(); ref.current?.setPointerCapture(e.pointerId); drawing.current = true; last.current = point(e); }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = ref.current!.getContext("2d");
            const p = point(e);
            if (ctx && last.current) {
              ctx.strokeStyle = "#101828"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
              ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
            }
            last.current = p;
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
      )}
      {def.hint && <div className="m-mu" style={{ fontSize: 12.5 }}>{def.hint}</div>}
    </div>
  );
}

function Field({ def, value, onChange, aiFilled = false }: { def: FieldDef; value: unknown; onChange: (v: string | boolean) => void; aiFilled?: boolean }) {
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
        <div style={{ display: "flex", gap: 8, flexWrap: def.options!.length > 3 ? "wrap" : undefined }}>
          {def.options!.map((o) => {
            const on = value === o.value;
            const good = ["conform", "da", "admis", "ok"].includes(o.value);
            const bad = ["neconform", "nu", "respins", "C1", "C2"].includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className="m-chip"
                style={{
                  flex: def.options!.length > 3 ? "1 1 40%" : 1, justifyContent: "center", padding: "15px 8px", fontSize: 15.5, fontWeight: 800,
                  ...(on ? (good ? { background: "var(--m-ok-bg)", borderColor: "#86d39a", color: "var(--m-ok)" } : bad ? { background: "var(--m-bad-bg)", borderColor: "#f0a3a3", color: "var(--m-bad)" } : { background: "var(--m-acs)", borderColor: "var(--m-ac)", color: "var(--m-aci)" }) : {}),
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
    const serials = def.scan ? parseSerials(value) : [];
    return (
      <div className="m-fld">
        <label htmlFor={id}>{def.label}{def.scan && serials.length ? ` · ${serials.length}` : ""}</label>
        <textarea id={id} className="m-in" placeholder={def.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        {def.scan && <ScanButton onResult={(vals) => onChange(parseSerials([String(value ?? ""), ...vals].join("\n")).join("\n"))} />}
      </div>
    );
  }
  return (
    <div className="m-fld">
      <label htmlFor={id}>{def.label}{def.required ? "" : " (opțional)"}{aiFilled && <AiBadge />}</label>
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
      {def.scan && <ScanButton onResult={(vals) => onChange(vals[0])} />}
      {def.hint && <div className="m-mu" style={{ fontSize: 12.5 }}>{def.hint}</div>}
    </div>
  );
}

export function FormRunner({
  jobId, jobLabel, template, initialData, alreadyCompleted, buildOp, doneHref, lockedNotice, aiEnabled = false,
}: {
  jobId: string;
  jobLabel: string;
  template: FormTemplate;
  initialData: Data;
  alreadyCompleted: boolean;
  /** Altă destinație decât job_forms (ex. fișa de gaze). */
  buildOp?: (data: Data, complete: boolean, at: string) => QueuedOp;
  doneHref?: string;
  lockedNotice?: string | null;
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initialData);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const current = template.steps[step];
  // Eroarea apare sub formular: o aducem în ecran. La pas nou, începem de sus.
  useEffect(() => {
    if (error) document.querySelector(".m-bd [role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error, missing]);
  useEffect(() => {
    document.querySelector(".m-bd")?.scrollTo({ top: 0 });
  }, [step]);
  const last = step === template.steps.length - 1;
  const set = (key: string, v: unknown) => setData((d) => ({ ...d, [key]: v }));

  // Plăcuța citită cu AI: completăm câmpurile echipamentului și ținem minte ce a propus AI-ul
  // (în __ai, ca să meargă și fără semnal); la salvarea finală, serverul notează corecturile în jurnal.
  type AiMap = Record<string, Record<string, unknown>>;
  const aiFilled = (key: string) => Object.values((data.__ai ?? {}) as AiMap).some((m) => m[key] !== undefined && m[key] !== null && String(m[key]) === String(data[key] ?? ""));
  function applyPlate(group: string, p: Plate, logId: string | null) {
    const fields = template.steps.flatMap((st) => st.fields ?? []).filter((f) => f.plate?.group === group);
    const proposed: Record<string, unknown> = {};
    for (const f of fields) {
      const role = f.plate!.role;
      let v: string | null = null;
      if (role === "model") v = brandModel(p);
      else if (role === "serie") v = p.serie;
      else if (role === "putere" && p.putere) {
        const n = Number(p.putere.replace(",", ".").replace(/[^\d.]/g, ""));
        if (Number.isFinite(n) && n > 0) v = String(f.unit === "W" && /kw/i.test(p.putere) ? Math.round(n * 1000) : n);
      }
      if (v) proposed[f.key] = v;
    }
    setData((d) => ({ ...d, ...proposed, ...(logId ? { __ai: { ...((d.__ai ?? {}) as AiMap), [logId]: proposed } } : {}) }));
  }

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
    // Câmpurile obligatorii le verificăm și pe telefon: fără semnal, serverul nu poate spune ce lipsește.
    if (complete) {
      const miss = missingRequired(template, payload);
      if (miss.length) {
        setBusy(false);
        setError("Mai ai câmpuri obligatorii necompletate.");
        setMissing(miss);
        return false;
      }
    }
    // Fără semnal, pașii intermediari rămân doar pe ecran; formularul terminat se salvează pe
    // telefon și pleacă singur când revine semnalul.
    if (!complete && typeof navigator !== "undefined" && !navigator.onLine) {
      setBusy(false);
      return true;
    }
    const at = new Date().toISOString();
    const op: QueuedOp = buildOp ? buildOp(payload, complete, at) : { kind: "form", jobId, template: template.id, label: template.label, data: payload, complete, at };
    const result = await runOrQueue(op);
    setBusy(false);
    if (result.status === "error") {
      setError(result.error);
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
      if (await persist(payload, true)) router.push(doneHref ?? `/mobil/lucrari/${jobId}`);
    } else {
      // Fiecare pas se verifică pe loc: tehnicianul află acum ce lipsește, nu abia la semnături.
      const stepMissing = missingRequired({ ...template, steps: [current] }, payload);
      if (stepMissing.length) {
        setError("Completează ce lipsește la acest pas.");
        setMissing(stepMissing);
        return;
      }
      setError(null);
      setMissing([]);
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
        {lockedNotice && <div className="m-note warn m-sm">{lockedNotice}</div>}
        {!lockedNotice && alreadyCompleted && step === 0 && <div className="m-note ac m-sm">Acest formular a fost deja completat. Dacă îl salvezi din nou, valorile se actualizează.</div>}
        <div className="m-cd m-col" style={{ gap: 14 }}>
          <div className="m-mu m-sm" style={{ marginTop: -4 }}>{jobLabel}</div>
          {current.note && <div className="m-note ac m-sm">{current.note}</div>}
          {(current.fields ?? []).filter((f) => isFieldVisible(f, data)).map((f, idx, visible) => {
            // „Citește plăcuța”: o dată pe echipament, deasupra primului lui câmp.
            const firstOfGroup = aiEnabled && f.plate && visible.findIndex((g) => g.plate?.group === f.plate!.group) === idx;
            const input = f.type === "ops" ? (
              <OpsField key={f.key} def={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
            ) : f.type === "signature" ? (
              <SignatureField key={f.key} def={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
            ) : (
              <Field key={f.key} def={f} value={data[f.key]} onChange={(v) => set(f.key, v)} aiFilled={aiFilled(f.key)} />
            );
            return firstOfGroup ? (
              <div key={f.key} className="m-col" style={{ gap: 14 }}>
                <AiReadButton kind="placuta" label={`Citește plăcuța ${f.plate!.group} (AI)`} onResult={(p, logId) => applyPlate(f.plate!.group, p, logId)} />
                {input}
              </div>
            ) : input;
          })}
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

        {template.id === "pv_punere_in_functiune" && rep?.key === "stringuri" && (() => {
          const checks = expectedStringVoc({ ...data, stringuri: rows });
          if (!checks.length) return null;
          return (
            <div className="m-note m-sm">
              <div className="m-fl">
                <b>Voc așteptat (din fișa panoului, la temperatura dată)</b>
                {checks.map((c) => (
                  <div key={c.index}>String {c.index}: așteptat ~{c.expected.toLocaleString("ro-RO")} V, măsurat {c.measured.toLocaleString("ro-RO")} V ({c.deviationPct > 0 ? "+" : ""}{c.deviationPct.toLocaleString("ro-RO")}%)</div>
                ))}
                <div className="m-mu" style={{ marginTop: 4 }}>Doar informativ. O abatere mare poate însemna un panou lipsă din string, un conector sau o polaritate greșită; rezultatul îl stabilești tu.</div>
              </div>
            </div>
          );
        })()}

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
        <button type="button" className="m-btn" disabled={busy || (Boolean(lockedNotice) && last)} onClick={next}>
          {busy ? "Se salvează…" : last ? "Salvează formularul" : "Continuă"}
        </button>
        {step > 0 && <button type="button" className="m-link" style={{ textAlign: "center", color: "var(--m-mu)" }} onClick={() => setStep((s) => s - 1)}>Înapoi</button>}
      </div>
    </div>
  );
}

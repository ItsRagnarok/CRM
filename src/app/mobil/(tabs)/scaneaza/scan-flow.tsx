"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, FileText, Plus, Receipt, Tag, Trash2, Wallet } from "lucide-react";
import { saveScan, type ScanType } from "./actions";

const TYPES: { id: ScanType; label: string; icon: typeof Receipt }[] = [
  { id: "bon", label: "Bon", icon: Receipt },
  { id: "factura", label: "Factură", icon: FileText },
  { id: "eticheta", label: "Etichetă", icon: Tag },
  { id: "document", label: "Document", icon: FileText },
];

// Phone photos are 3–8 MB; the server accepts ~4 MB per request, so shrink in the browser first.
async function compress(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type Page = { file: File; url: string };

export function ScanFlow({ jobs, defaultJobId, defaultType }: { jobs: { id: string; label: string }[]; defaultJobId: string; defaultType: ScanType }) {
  const [type, setType] = useState<ScanType>(defaultType);
  const [pages, setPages] = useState<Page[]>([]);
  const [jobId, setJobId] = useState(defaultJobId);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    if (!files) return;
    const added: Page[] = [];
    for (const f of Array.from(files)) {
      const small = await compress(f);
      added.push({ file: small, url: URL.createObjectURL(small) });
    }
    setPages((p) => [...p, ...added]);
    if (input.current) input.current.value = "";
  }

  async function save() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("type", type);
    fd.set("jobId", jobId);
    fd.set("note", note);
    for (const p of pages) fd.append("pages", p.file);
    const result = await saveScan(fd);
    setBusy(false);
    if (result.error) setError(result.error);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="m-bd">
        <div className="m-empty">
          <div className="m-ill"><CheckCircle2 className="m-i" strokeWidth={1.5} /></div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Salvat</div>
          <div className="m-mu" style={{ fontSize: 15 }}>Documentul e în „Documente și autorizații” și biroul îl vede.</div>
          {type === "bon" && (
            <Link href={jobId ? `/mobil/cheltuieli/noua?job=${jobId}` : "/mobil/cheltuieli/noua"} className="m-btn" style={{ width: "auto", padding: "0 24px" }}>
              <Wallet className="m-i" /> Adaugă și ca cheltuială
            </Link>
          )}
          <button type="button" className="m-bt2" style={{ width: "auto", padding: "0 24px" }} onClick={() => { setPages([]); setNote(""); setDone(false); }}>
            Scanează altul
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="m-bd">
        <div className="m-chips" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
          {TYPES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`m-chip ${type === id ? "on" : ""}`} onClick={() => setType(id)}>
              <Icon className="m-i" /> {label}
            </button>
          ))}
        </div>

        <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onPick(e.target.files)} />

        {pages.length === 0 ? (
          <button type="button" onClick={() => input.current?.click()} className="m-cd" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 20px", borderStyle: "dashed", borderWidth: 2, color: "var(--m-ink)" }}>
            <span className="m-ic" style={{ width: 72, height: 72, borderRadius: 24 }}><Camera className="m-i" style={{ width: 32, height: 32 }} /></span>
            <span style={{ fontSize: 17, fontWeight: 800 }}>Fă o poză</span>
            <span className="m-mu m-sm" style={{ textAlign: "center" }}>Așază hârtia pe o suprafață plană, cu lumină bună, și fotografiaz-o întreagă.</span>
          </button>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {pages.map((p, i) => (
              <div key={p.url} style={{ position: "relative", aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden", border: "1px solid var(--m-ln)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Pagina ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" aria-label={`Șterge pagina ${i + 1}`} onClick={() => setPages((all) => all.filter((x) => x !== p))} className="m-ib sm" style={{ position: "absolute", top: 6, right: 6, width: 34, height: 34 }}>
                  <Trash2 className="m-i" style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => input.current?.click()} style={{ aspectRatio: "3 / 4", borderRadius: 14, border: "2px dashed var(--m-input-ln)", background: "var(--m-card)", color: "var(--m-mu)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
              <Plus className="m-i" /> Pagină
            </button>
          </div>
        )}

        {pages.length > 0 && (
          <>
            <div className="m-fld">
              <label htmlFor="scanJob">Leagă de o lucrare (opțional)</label>
              <select id="scanJob" className="m-in" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">Fără lucrare</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            </div>
            <div className="m-fld">
              <label htmlFor="scanNote">Notă (opțional)</label>
              <input id="scanNote" className="m-in" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="ex. Factură Electro Depot" />
            </div>
          </>
        )}
        {error && <div className="m-note bad" role="alert" style={{ fontWeight: 700 }}>{error}</div>}
        <div className="m-mu m-sm" style={{ textAlign: "center" }}>
          Citirea automată a sumelor și datelor din poză (AI) se activează într-o etapă următoare. Până atunci documentul se salvează ca imagine.
        </div>
      </div>
      {pages.length > 0 && (
        <div className="m-ft">
          <button type="button" className="m-btn" disabled={busy} onClick={save}>{busy ? "Se salvează…" : `Salvează ${pages.length > 1 ? `${pages.length} pagini` : "documentul"}`}</button>
        </div>
      )}
    </>
  );
}

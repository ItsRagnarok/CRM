"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, CloudUpload, DoorClosed, Phone, Ban } from "lucide-react";
import { listQueue, onQueueChange, type QueueItem } from "@/lib/offline/queue";
import { runOrQueue } from "@/lib/offline/send";

export type UnitRow = {
  id: string;
  stair: string;
  apartment: string;
  owner: string | null;
  phone: string | null;
  state: "de_facut" | "inceput" | "facut" | "sistat" | "absent" | "refuz" | "reprogramat";
  kind: "verificare" | "revizie";
  rescheduleOn: string | null;
  expired: string[];
};

const STATE: Record<UnitRow["state"], { label: string; tone: string }> = {
  de_facut: { label: "De făcut", tone: "" },
  inceput: { label: "Fișă începută", tone: "ac" },
  facut: { label: "Făcut", tone: "ok" },
  sistat: { label: "Gaz întrerupt", tone: "bad" },
  absent: { label: "Absent", tone: "wr" },
  refuz: { label: "Refuză", tone: "bad" },
  reprogramat: { label: "Reprogramat", tone: "wr" },
};
const OPEN = new Set<UnitRow["state"]>(["de_facut", "inceput", "absent", "reprogramat"]);
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "numeric", month: "short" });

function useQueuedGas(jobId: string) {
  const [items, setItems] = useState<QueueItem[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => listQueue().then((all) => alive && setItems(all.filter((i) => i.op.jobId === jobId && !i.failed && (i.op.kind === "gas" || i.op.kind === "gas_visit"))));
    load();
    const off = onQueueChange(load);
    return () => { alive = false; off(); };
  }, [jobId]);
  return items;
}

export function BuildingList({ jobId, rows, today }: { jobId: string; rows: UnitRow[]; today: string }) {
  const router = useRouter();
  const queued = useQueuedGas(jobId);
  const [filter, setFilter] = useState<"ramase" | "toate" | "facute">("ramase");
  const [open, setOpen] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ce e salvat pe telefon (fără semnal) se vede imediat în listă.
  const merged = useMemo(() => {
    const local = new Map<string, UnitRow["state"]>();
    for (const i of queued) {
      if (i.op.kind === "gas_visit") local.set(i.op.unitId, i.op.outcome);
      if (i.op.kind === "gas" && i.op.complete && i.op.unitId) local.set(i.op.unitId, i.op.data.intrerupt === true ? "sistat" : "facut");
    }
    return rows.map((r) => (local.has(r.id) && OPEN.has(r.state) ? { ...r, state: local.get(r.id)!, onPhone: true } : { ...r, onPhone: false }));
  }, [rows, queued]);

  // Cu semnal, încarcă dinainte fișele apartamentelor rămase: la subsol sau pe scară se pot deschide și fără semnal.
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return;
    const urls = rows.filter((r) => OPEN.has(r.state)).slice(0, 60).map((r) => `/mobil/lucrari/${jobId}/gaze/${r.id}?tip=${r.kind}`);
    if (urls.length) navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "warm", urls })).catch(() => {});
  }, [jobId, rows]);

  const count = (pred: (r: UnitRow) => boolean) => merged.filter(pred).length;
  const shown = merged.filter((r) => (filter === "toate" ? true : filter === "facute" ? !OPEN.has(r.state) : OPEN.has(r.state)));

  async function visit(r: UnitRow, outcome: "absent" | "refuz" | "reprogramat") {
    if (outcome === "reprogramat" && !date) { setError("Alege data reprogramării."); return; }
    setBusy(r.id);
    setError(null);
    const res = await runOrQueue({ kind: "gas_visit", jobId, unitId: r.id, unitLabel: `Sc. ${r.stair || "—"}, ap. ${r.apartment}`, outcome, rescheduleOn: outcome === "reprogramat" ? date : null, note: "", at: new Date().toISOString() });
    setBusy(null);
    if (res.status === "error") { setError(res.error); return; }
    setOpen(null);
    setDate("");
    if (res.status === "sent") router.refresh();
  }

  return (
    <div className="m-bd">
      <div className="m-cd" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center", padding: 12 }}>
        {[
          ["Făcute", count((r) => r.state === "facut")],
          ["Rămase", count((r) => OPEN.has(r.state))],
          ["Absenți", count((r) => r.state === "absent")],
          ["Refuz / sistat", count((r) => r.state === "refuz" || r.state === "sistat")],
        ].map(([l, n]) => (
          <div key={l as string}><div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{n}</div><div className="m-mu" style={{ fontSize: 11.5 }}>{l}</div></div>
        ))}
      </div>

      <div className="m-r" style={{ gap: 8 }}>
        {(["ramase", "toate", "facute"] as const).map((f) => (
          <button key={f} type="button" className={`m-pl ${filter === f ? "ac" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "ramase" ? "Rămase" : f === "toate" ? "Toate" : "Terminate"}
          </button>
        ))}
      </div>

      {error && <div className="m-note bad m-sm" role="alert"><div className="m-fl" style={{ fontWeight: 700, color: "var(--m-bad)" }}>{error}</div></div>}

      {shown.length === 0 && <div className="m-cd m-mu" style={{ textAlign: "center" }}>{filter === "ramase" ? "Nu mai ai apartamente de făcut pe acest bloc." : "Niciun apartament."}</div>}

      {shown.map((r) => {
        const st = STATE[r.state];
        const fisa = `/mobil/lucrari/${jobId}/gaze/${r.id}?tip=${r.kind}`;
        const other = r.kind === "verificare" ? "revizie" : "verificare";
        return (
          <div key={r.id} className="m-cd m-col" style={{ gap: 10, padding: 14 }}>
            <div className="m-r" style={{ gap: 8 }}>
              <div className="m-fl">
                <div style={{ fontSize: 16, fontWeight: 800 }}>Sc. {r.stair || "—"} · Ap. {r.apartment}</div>
                <div className="m-mu m-sm">{r.owner ?? "Fără nume"}{r.rescheduleOn && r.state === "reprogramat" ? ` · revine ${fmt(r.rescheduleOn)}` : ""}</div>
              </div>
              {r.phone && <a href={`tel:${r.phone}`} className="m-ib sm" aria-label={`Sună ap. ${r.apartment}`}><Phone className="m-i" /></a>}
              <span className={`m-pl ${st.tone}`}>{st.label}</span>
            </div>
            {(r.expired.length > 0 || r.onPhone) && (
              <div className="m-r" style={{ gap: 6, flexWrap: "wrap" }}>
                {r.expired.map((e) => <span key={e} className="m-pl bad">{e}</span>)}
                {r.onPhone && <span className="m-pl" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><CloudUpload style={{ width: 13, height: 13 }} /> salvat pe telefon</span>}
              </div>
            )}
            {OPEN.has(r.state) ? (
              <>
                <div className="m-r" style={{ gap: 8 }}>
                  <Link href={fisa} className="m-btn sm" style={{ flex: 1 }}>{r.state === "inceput" ? "Continuă fișa" : `Fișă · ${r.kind}`} <ChevronRight className="m-i" /></Link>
                  {r.state !== "inceput" && <Link href={`/mobil/lucrari/${jobId}/gaze/${r.id}?tip=${other}`} className="m-pl">{other === "revizie" ? "Revizie" : "Verificare"}</Link>}
                </div>
                <div className="m-r" style={{ gap: 8 }}>
                  <button type="button" className="m-bt2 sm" style={{ flex: 1 }} disabled={busy === r.id} onClick={() => visit(r, "absent")}><DoorClosed className="m-i" style={{ width: 17, height: 17 }} /> Absent</button>
                  <button type="button" className="m-bt2 sm" style={{ flex: 1 }} disabled={busy === r.id} onClick={() => visit(r, "refuz")}><Ban className="m-i" style={{ width: 17, height: 17 }} /> Refuză</button>
                  <button type="button" className="m-bt2 sm" style={{ flex: 1 }} onClick={() => { setOpen(open === r.id ? null : r.id); setDate(""); }}><CalendarClock className="m-i" style={{ width: 17, height: 17 }} /> Altă zi</button>
                </div>
                {open === r.id && (
                  <div className="m-r" style={{ gap: 8 }}>
                    <input type="date" className="m-in" min={today} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data reprogramării" style={{ flex: 1 }} />
                    <button type="button" className="m-btn sm" disabled={busy === r.id} onClick={() => visit(r, "reprogramat")}>Salvează</button>
                  </div>
                )}
              </>
            ) : (
              <Link href={fisa} className="m-link m-sm" style={{ color: "var(--m-mu)" }}>Vezi fișa →</Link>
            )}
          </div>
        );
      })}
      <div className="m-mu m-sm" style={{ textAlign: "center" }}>„Absent”, „Refuză” și „Altă zi” ajung în scadențarul biroului. Merg și fără semnal.</div>
    </div>
  );
}

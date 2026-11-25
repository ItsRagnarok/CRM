"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CloudUpload, Flag, Pause, Wrench } from "lucide-react";
import { listQueue, onQueueChange, type QueueItem } from "@/lib/offline/queue";
import { runOrQueue } from "@/lib/offline/send";
import { ArriveButton } from "./arrive-button";

/** Ce e salvat pe telefon pentru lucrarea asta și încă nu a ajuns la server. */
export function useQueuedForJob(jobId: string) {
  const [items, setItems] = useState<QueueItem[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => listQueue().then((all) => alive && setItems(all.filter((i) => i.op.jobId === jobId && !i.failed)));
    load();
    const off = onQueueChange(load);
    return () => { alive = false; off(); };
  }, [jobId]);
  const photos = (cat: string) => items.filter((i) => i.op.kind === "photo" && i.op.category === cat).length;
  const has = (event: "arrival" | "work_start") => items.some((i) => i.op.kind === "event" && i.op.event === event);
  const formDone = items.some((i) => i.op.kind === "form" && i.op.complete);
  return { items, photos, arrived: has("arrival"), working: has("work_start"), finalized: items.some((i) => i.op.kind === "finalize"), formDone };
}

export function SavedOnPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-mu m-sm" style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <CloudUpload className="m-i" style={{ width: 16, height: 16 }} /> {children}
    </div>
  );
}

function StartWorkButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="m-btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await runOrQueue({ kind: "event", jobId, event: "work_start", at: new Date().toISOString() });
          setBusy(false);
          if (r.status === "error") setError(r.error);
          else router.refresh();
        }}
      >
        <Wrench className="m-i" /> {busy ? "Se pornește…" : "Pornește lucrul"}
      </button>
      {error && <div className="m-sm" style={{ color: "var(--m-er, #b42318)", textAlign: "center" }}>{error}</div>}
    </>
  );
}

/**
 * Butoanele de jos ale lucrării. Starea vine de la server, dar ținem cont și de ce e salvat
 * pe telefon fără semnal (sosire, început lucru, poze, închidere): tehnicianul nu rămâne blocat
 * doar pentru că serverul încă nu a primit poza de sosire.
 */
export function JobFooter(p: {
  jobId: string;
  isTraveling: boolean;
  isArrived: boolean;
  isWorking: boolean;
  jobLat?: number;
  jobLng?: number;
  requireArrival: boolean;
  requireDuring: boolean;
  requireFinal: boolean;
  serverPhotos: { before: number; during: number; after: number };
  missingFormLabel: string | null;
}) {
  const q = useQueuedForJob(p.jobId);
  const isWorking = p.isWorking || ((p.isArrived || p.isTraveling) && q.working);
  const isArrived = !isWorking && (p.isArrived || (p.isTraveling && q.arrived));
  const isTraveling = !isWorking && !isArrived && p.isTraveling;
  const count = (cat: "before" | "during" | "after") => p.serverPhotos[cat] + q.photos(cat);
  const missingArrival = p.requireArrival && count("before") === 0;
  const missingDuring = p.requireDuring && count("during") === 0;
  const missingFinal = p.requireFinal && count("after") === 0;
  const missingFormLabel = q.formDone ? null : p.missingFormLabel;

  if (q.finalized) {
    return <SavedOnPhone>Lucrarea e închisă pe telefon. Se trimite la birou când revine semnalul.</SavedOnPhone>;
  }

  return (
    <>
      {isTraveling && <ArriveButton jobId={p.jobId} jobLat={p.jobLat} jobLng={p.jobLng} />}
      {isArrived &&
        (missingArrival ? (
          <>
            <Link href={`/mobil/lucrari/${p.jobId}/foto?cat=before`} className="m-btn"><Camera className="m-i" /> Fă poza de sosire</Link>
            <div className="m-mu m-sm" style={{ textAlign: "center" }}>Poza de sosire e obligatorie înainte să pornești lucrul.</div>
          </>
        ) : (
          <>
            <StartWorkButton jobId={p.jobId} />
            {q.arrived && <SavedOnPhone>Sosirea e salvată pe telefon.</SavedOnPhone>}
          </>
        ))}
      {isWorking && (
        <>
          {missingDuring || missingFormLabel ? (
            <>
              <button type="button" className="m-btn off" disabled><Flag className="m-i" /> Închide lucrarea</button>
              <div className="m-mu m-sm" style={{ textAlign: "center" }}>
                Mai ai de făcut: {[missingDuring && "poza din timpul lucrării", missingFormLabel && `formularul „${missingFormLabel}”`].filter(Boolean).join(" și ")}.
              </div>
            </>
          ) : (
            <Link href={`/mobil/lucrari/${p.jobId}/finalizare`} className="m-btn"><Flag className="m-i" /> Închide lucrarea</Link>
          )}
          {q.working && <SavedOnPhone>Începutul lucrului e salvat pe telefon.</SavedOnPhone>}
          <div className="m-r" style={{ justifyContent: "space-between" }}>
            <span className="m-mu m-sm">{missingFinal ? "Poza finală e cerută la închidere" : " "}</span>
            <Link href={`/mobil/lucrari/${p.jobId}/extra`} className="m-link" style={{ color: "var(--m-wr)", display: "flex", gap: 6, alignItems: "center" }}>
              <Pause className="m-i" style={{ width: 16, height: 16 }} /> Nu pot finaliza
            </Link>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Cu semnal, încarcă dinainte în telefon pașii lucrării (poze, închidere, semnătură),
 * ca să meargă și dacă tehnicianul pierde semnalul la client (subsol, bloc, câmp).
 */
export function WarmJobPages({ jobId, formTemplateId }: { jobId: string; formTemplateId?: string | null }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return;
    const base = `/mobil/lucrari/${jobId}`;
    const urls = [base, `${base}/foto?cat=before`, `${base}/foto?cat=during`, `${base}/foto?cat=after`, `${base}/finalizare`, `${base}/semnatura`, `${base}/facturare`];
    if (formTemplateId) urls.push(`${base}/formular/${formTemplateId}`);
    navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "warm", urls })).catch(() => {});
  }, [jobId, formTemplateId]);
  return null;
}

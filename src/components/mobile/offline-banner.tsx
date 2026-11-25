"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, WifiOff, AlertTriangle } from "lucide-react";
import { describeOp, flushQueue, listQueue, onQueueChange, removeItem, retryItem, type QueueItem } from "@/lib/offline/queue";
import { sendOp } from "@/lib/offline/send";

// Banda de sus a aplicației: spune cinstit ce se întâmplă cu semnalul și cu ce a rămas pe telefon.
//  - fără semnal: „Ești offline. N acțiuni salvate pe telefon, pleacă singure când revine semnalul.”
//  - cu semnal și coadă: „Se trimit N acțiuni…” (trimite automat)
//  - ceva respins de server: arată ce și oferă „Reîncearcă” / „Renunță”.
// Tot aici se înregistrează service worker-ul care ține paginile deschise disponibile fără semnal.
export function OfflineBanner() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => setItems(await listQueue()), []);

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;
    const before = await listQueue();
    if (!before.some((i) => !i.failed)) return;
    setSending(true);
    const { sent } = await flushQueue(sendOp);
    setSending(false);
    await refresh();
    if (sent > 0) router.refresh();
  }, [refresh, router]);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void flush();
    };
    update();
    void refresh();
    const off = onQueueChange(() => void refresh());
    const onVisible = () => document.visibilityState === "visible" && void flush();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", onVisible);
    // „online” nu vine mereu (ex. semnal slab care revine încet): reîncercăm și periodic.
    const timer = window.setInterval(() => void flush(), 30_000);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/mobil" }).catch(() => {});
    }
    return () => {
      off();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [flush, refresh]);

  const pending = items.filter((i) => !i.failed);
  const failed = items.filter((i) => i.failed);
  if (online && items.length === 0) return null;

  const n = (k: number) => (k === 1 ? "o acțiune" : `${k} acțiuni`);
  const saved = (k: number) => (k === 1 ? "o acțiune salvată" : `${k} acțiuni salvate`);
  let text: string;
  if (!online) text = pending.length ? `Ești offline. ${saved(pending.length)} pe telefon, ${pending.length === 1 ? "pleacă singură" : "pleacă singure"} când revine semnalul.` : "Ești offline. Poți lucra în continuare: pozele, semnătura și pașii lucrării se salvează pe telefon.";
  else if (pending.length) text = sending ? `Se trimite: ${saved(pending.length)} pe telefon…` : pending.length === 1 ? "O acțiune așteaptă să fie trimisă." : `${n(pending.length)} așteaptă să fie trimise.`;
  else text = `${n(failed.length)} nu au putut fi trimise.`;

  return (
    <div role="status" aria-live="polite">
      <button type="button" className="m-offline" style={{ width: "100%", border: 0, textAlign: "left", cursor: "pointer", background: failed.length && online ? "var(--m-wr, #b54708)" : undefined }} onClick={() => setOpen((o) => !o)}>
        {!online ? <WifiOff className="m-i" style={{ width: 18, height: 18 }} /> : failed.length && !pending.length ? <AlertTriangle className="m-i" style={{ width: 18, height: 18 }} /> : <CloudUpload className="m-i" style={{ width: 18, height: 18 }} />}
        <span style={{ flex: 1 }}>{text}</span>
        {items.length > 0 && <span style={{ fontWeight: 800, textDecoration: "underline" }}>{open ? "Ascunde" : "Vezi"}</span>}
      </button>
      {open && items.length > 0 && (
        <div className="m-cd" style={{ margin: 8, display: "grid", gap: 8 }}>
          {items.map((i) => (
            <div key={i.id} className="m-r" style={{ justifyContent: "space-between", gap: 8, fontSize: 13.5 }}>
              <div className="m-fl">
                <b>{describeOp(i.op)}</b>
                <div className="m-mu m-sm">
                  {new Date(i.op.kind === "photo" ? i.op.takenAt : i.op.kind === "signature" ? i.op.signedAt : i.op.at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  {i.failed ? ` · nu s-a putut trimite: ${i.lastError ?? "eroare"}` : i.lastError ? ` · ${i.lastError}` : " · în așteptare"}
                </div>
              </div>
              {i.failed && (
                <div className="m-r" style={{ gap: 10 }}>
                  <button type="button" className="m-link" onClick={async () => { await retryItem(i.id); void flush(); }}>Reîncearcă</button>
                  <button type="button" className="m-link" style={{ color: "var(--m-mu)" }} onClick={() => removeItem(i.id)}>Renunță</button>
                </div>
              )}
            </div>
          ))}
          {online && pending.length > 0 && !sending && <button type="button" className="m-btn sm" onClick={() => void flush()}>Trimite acum</button>}
        </div>
      )}
    </div>
  );
}

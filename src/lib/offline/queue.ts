"use client";

// Coada locală a telefonului: ce face tehnicianul fără semnal (poze, semnătură, sosire,
// început lucru, închidere) se păstrează aici (IndexedDB, rezistă la închiderea aplicației)
// și se trimite automat, în ordine, când revine semnalul.

export type QueuedOp =
  | { kind: "photo"; jobId: string; category: string; file: Blob; fileName: string; takenAt: string }
  | { kind: "signature"; jobId: string; signerName: string; dataUrl: string; signedAt: string }
  | { kind: "event"; jobId: string; event: "arrival" | "work_start"; at: string; lat?: number | null; lng?: number | null; ssm?: { template: string; items: Record<string, boolean>; note?: string } }
  | { kind: "finalize"; jobId: string; observations: string; equipmentIssue: string; at: string }
  | { kind: "form"; jobId: string; template: string; label: string; data: Record<string, unknown>; complete: boolean; at: string }
  | { kind: "gas"; jobId: string; unitId: string | null; unitLabel: string; recordKind: "verificare" | "revizie"; data: Record<string, unknown>; complete: boolean; at: string }
  | { kind: "incident"; jobId: string | null; incidentKind: string; injured: boolean; description: string; file: Blob | null; at: string; lat: number | null; lng: number | null }
  | { kind: "gas_visit"; jobId: string; unitId: string; unitLabel: string; outcome: "absent" | "refuz" | "reprogramat"; rescheduleOn: string | null; note: string; at: string };

export type QueueItem = { id: string; op: QueuedOp; createdAt: string; attempts: number; lastError?: string; failed?: boolean };

const DB = "ef-offline";
const STORE = "ops";
const EVENT = "ef-offline-queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(r.result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

export const newOpId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const notify = () => window.dispatchEvent(new Event(EVENT));
export const onQueueChange = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};

export async function enqueue(op: QueuedOp, id: string = newOpId()): Promise<string> {
  const item: QueueItem = { id, op, createdAt: new Date().toISOString(), attempts: 0 };
  await tx("readwrite", (s) => s.put(item));
  notify();
  return id;
}

export async function listQueue(): Promise<QueueItem[]> {
  try {
    const all = await tx<QueueItem[]>("readonly", (s) => s.getAll() as IDBRequest<QueueItem[]>);
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function removeItem(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  notify();
}

async function saveItem(item: QueueItem) {
  await tx("readwrite", (s) => s.put(item));
  notify();
}

/** O eroare de rețea (fără semnal, timeout) — nu o eroare spusă de server. */
export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /Failed to fetch|NetworkError|Load failed|network|fetch failed|TypeError|ERR_INTERNET|timed? ?out/i.test(msg);
}

export type Sender = (id: string, op: QueuedOp) => Promise<{ ok: true } | { error: string }>;

let flushing = false;

/**
 * Trimite tot ce e în coadă, în ordine. Se oprește la prima problemă de rețea (încearcă din nou
 * mai târziu). O eroare spusă de server (ex. lucrarea a fost ștearsă) marchează operația ca
 * „nereușită”, ca tehnicianul s-o vadă — nu o ștergem pe tăcute.
 */
export async function flushQueue(send: Sender): Promise<{ sent: number; pending: number }> {
  if (flushing || (typeof navigator !== "undefined" && !navigator.onLine)) return { sent: 0, pending: (await listQueue()).length };
  flushing = true;
  let sent = 0;
  try {
    for (const item of await listQueue()) {
      if (item.failed) continue;
      try {
        const res = await send(item.id, item.op);
        if ("ok" in res) {
          await removeItem(item.id);
          sent++;
        } else {
          await saveItem({ ...item, attempts: item.attempts + 1, lastError: res.error, failed: item.attempts + 1 >= 3 });
        }
      } catch (e) {
        if (isNetworkError(e)) {
          await saveItem({ ...item, attempts: item.attempts + 1, lastError: "Fără semnal" });
          break;
        }
        await saveItem({ ...item, attempts: item.attempts + 1, lastError: "Eroare la trimitere", failed: item.attempts + 1 >= 3 });
      }
    }
  } finally {
    flushing = false;
  }
  return { sent, pending: (await listQueue()).length };
}

/** Reia o operație marcată „nereușită” (butonul „Reîncearcă”). */
export async function retryItem(id: string) {
  const item = (await listQueue()).find((i) => i.id === id);
  if (item) await saveItem({ ...item, failed: false, attempts: 0, lastError: undefined });
}

export function describeOp(op: QueuedOp): string {
  switch (op.kind) {
    case "photo": return "Poză";
    case "signature": return "Semnătura clientului";
    case "event": return op.event === "arrival" ? "Sosire la locație" : "Început lucru";
    case "finalize": return "Închiderea lucrării";
    case "form": return op.complete ? `Formular: ${op.label}` : `Formular (ciornă): ${op.label}`;
    case "gas": return `Fișa de gaze (${op.recordKind}) · ${op.unitLabel}`;
    case "incident": return "Raport de siguranță (incident)";
    case "gas_visit": return `${op.outcome === "absent" ? "Absent" : op.outcome === "refuz" ? "Refuz" : "Reprogramare"} · ${op.unitLabel}`;
  }
}

"use client";

import { uploadJobPhoto, saveSignature, syncJobEvent, syncFinalizeJob } from "@/app/mobil/lucrari/[id]/actions";
import { saveJobForm } from "@/app/mobil/lucrari/[id]/formular/actions";
import { enqueue, isNetworkError, newOpId, type QueuedOp, type Sender } from "./queue";

/** Trimite o operație la server. Același drum și pentru „acum”, și pentru coada offline. */
export const sendOp: Sender = async (id, op) => {
  switch (op.kind) {
    case "photo": {
      const fd = new FormData();
      fd.set("jobId", op.jobId);
      fd.set("category", op.category);
      fd.set("file", new File([op.file], op.fileName, { type: op.file.type || "image/jpeg" }));
      fd.set("opId", id);
      fd.set("takenAt", op.takenAt);
      const r = await uploadJobPhoto(fd);
      return r && "error" in r && r.error ? { error: r.error } : { ok: true };
    }
    case "signature": {
      const fd = new FormData();
      fd.set("jobId", op.jobId);
      fd.set("signerName", op.signerName);
      fd.set("dataUrl", op.dataUrl);
      fd.set("opId", id);
      fd.set("signedAt", op.signedAt);
      return saveSignature(fd);
    }
    case "event":
      return syncJobEvent({ opId: id, jobId: op.jobId, event: op.event, at: op.at, lat: op.lat ?? null, lng: op.lng ?? null });
    case "finalize":
      return syncFinalizeJob({ opId: id, jobId: op.jobId, observations: op.observations, equipmentIssue: op.equipmentIssue, at: op.at });
    case "form": {
      const r = await saveJobForm(op.jobId, op.template, op.data, op.complete, op.at);
      return "ok" in r ? { ok: true } : { error: r.missing?.length ? `${r.error} (${r.missing.slice(0, 3).join(", ")})` : r.error };
    }
  }
};

export type RunResult = { status: "sent" } | { status: "queued" } | { status: "error"; error: string };

/**
 * Încearcă acum. Fără semnal (sau dacă rețeaua cade în timpul trimiterii), operația intră în
 * coada telefonului și pleacă singură când revine semnalul — tehnicianul își continuă lucrul.
 */
export async function runOrQueue(op: QueuedOp): Promise<RunResult> {
  const id = newOpId();
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(op, id);
    return { status: "queued" };
  }
  try {
    const r = await sendOp(id, op);
    return "ok" in r ? { status: "sent" } : { status: "error", error: r.error };
  } catch (e) {
    if (isNetworkError(e)) {
      await enqueue(op, id);
      return { status: "queued" };
    }
    return { status: "error", error: "Nu am putut trimite. Încearcă din nou." };
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { runOrQueue } from "@/lib/offline/send";
import { useQueuedForJob } from "../job-footer";

/**
 * Închiderea lucrării. Merge și fără semnal: închiderea (cu ora de acum) se salvează pe telefon,
 * tehnicianul trece la semnătura clientului, iar biroul o primește când revine semnalul.
 * Poza finală salvată pe telefon (încă netrimisă) contează ca făcută.
 */
export function FinalizeForm({
  jobId,
  defaultObservations,
  requireFinal,
  serverFinalPhotos,
  summary,
}: {
  jobId: string;
  defaultObservations: string;
  requireFinal: boolean;
  serverFinalPhotos: number;
  summary: React.ReactNode;
}) {
  const router = useRouter();
  const queued = useQueuedForJob(jobId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFinalPhoto = !requireFinal || serverFinalPhotos + queued.photos("after") > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !hasFinalPhoto) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const r = await runOrQueue({
      kind: "finalize",
      jobId,
      observations: String(fd.get("observations") ?? ""),
      equipmentIssue: String(fd.get("equipmentIssue") ?? ""),
      at: new Date().toISOString(),
    });
    if (r.status === "error") {
      setBusy(false);
      setError(r.error);
      return;
    }
    router.push(`/mobil/lucrari/${jobId}/semnatura`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="px-4 pt-4">
        <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Observații (opțional)</div>
        <textarea
          name="observations"
          defaultValue={defaultObservations}
          rows={3}
          className="w-full resize-none rounded-[12px] border border-[#d0d5dd] p-3 text-[13.5px] outline-none focus:border-electric"
        />
      </div>

      <div className="px-4 pt-3">
        <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Defecțiuni scule/echipamente (dacă au fost)</div>
        <textarea
          name="equipmentIssue"
          rows={2}
          placeholder="Lasă gol dacă nu au fost probleme"
          className="w-full resize-none rounded-[12px] border border-[#d0d5dd] p-3 text-[13.5px] outline-none focus:border-electric"
        />
      </div>

      {summary}

      <div className="flex-1" />

      {!hasFinalPhoto && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-[12px] border border-warning-bg bg-warning-bg p-3.5">
          <Camera className="h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1 text-[12.5px] font-semibold text-[#7a5b0e]">
            Ai nevoie de o poză la lucrarea finalizată înainte să poți încheia.
          </div>
        </div>
      )}

      <div className="p-4">
        {error && <div className="mb-2 text-center text-[12.5px] font-semibold text-danger">{error}</div>}
        {hasFinalPhoto ? (
          <button
            type="submit"
            disabled={busy}
            className="block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)] disabled:opacity-60"
          >
            {busy ? "SE ÎNCHIDE…" : "FINALIZEAZĂ LUCRAREA"}
          </button>
        ) : (
          <Link
            href={`/mobil/lucrari/${jobId}/foto?cat=after`}
            className="flex items-center justify-center gap-2 rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
          >
            <Camera className="h-[18px] w-[18px]" /> FĂ POZA FINALĂ
          </Link>
        )}
      </div>
    </form>
  );
}

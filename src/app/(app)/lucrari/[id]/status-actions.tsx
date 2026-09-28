"use client";

import { useTransition } from "react";
import { updateJobStatus } from "../actions";
import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];

const NEXT_STEPS: Partial<Record<JobStatus, { status: JobStatus; label: string }[]>> = {
  programata: [{ status: "in_drum", label: "Marchează „În drum”" }],
  in_drum: [{ status: "ajunsa", label: "Marchează „Ajunsă”" }],
  ajunsa: [{ status: "in_lucru", label: "Începe lucrarea" }],
  in_lucru: [
    { status: "pauza", label: "Pauză" },
    { status: "finalizata", label: "Finalizează lucrarea" },
    { status: "necesita_atentie", label: "Marchează „Necesită atenție”" },
  ],
  pauza: [{ status: "in_lucru", label: "Continuă lucrarea" }],
  necesita_atentie: [{ status: "in_lucru", label: "Reia lucrarea" }],
};

export function StatusActions({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [isPending, startTransition] = useTransition();
  const options = NEXT_STEPS[status];

  if (!options) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.status}
          disabled={isPending}
          onClick={() => startTransition(() => updateJobStatus(jobId, opt.status))}
          className="rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { Navigation } from "lucide-react";
import { beginJobPrep } from "../lucrari/[id]/actions";

// Starts the pre-departure flow for a job (the job turns "în drum" right away).
export function StartJobButton({
  jobId,
  jobTitle,
  address,
  label = "Plec spre locație",
}: {
  jobId: string;
  jobTitle: string;
  address: string | null;
  label?: string;
}) {
  return (
    <form
      action={beginJobPrep}
      onSubmit={(e) => {
        const confirmed = window.confirm(`Pornești pregătirea pentru „${jobTitle}”${address ? ` — ${address}` : ""}?`);
        if (!confirmed) e.preventDefault();
      }}
    >
      <input type="hidden" name="jobId" value={jobId} />
      <button type="submit" className="m-btn">
        <Navigation className="m-i" />
        {label}
      </button>
    </form>
  );
}

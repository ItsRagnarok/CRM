"use client";

import { beginJobPrep } from "../lucrari/[id]/actions";

export function StartButtonCompact({
  jobId,
  jobTitle,
  address,
}: {
  jobId: string;
  jobTitle: string;
  address: string | null;
}) {
  return (
    <form
      action={beginJobPrep}
      onSubmit={(e) => {
        const confirmed = window.confirm(
          `Pornești pregătirea pentru „${jobTitle}”${address ? ` — ${address}` : ""}?`
        );
        if (!confirmed) e.preventDefault();
      }}
      className="flex-1"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <button
        type="submit"
        className="w-full rounded-[10px] bg-success py-3 text-center text-[13.5px] font-bold text-white"
      >
        START
      </button>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { startTravel } from "./actions";

export function StartTravelButton({
  jobId,
  jobTitle,
  address,
}: {
  jobId: string;
  jobTitle: string;
  address: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          `Sigur pornești spre „${jobTitle}”${address ? ` — ${address}` : ""}?`
        );
        if (!confirmed) return;
        startTransition(() => {
          startTravel(jobId);
        });
      }}
      className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)] disabled:opacity-70"
    >
      {pending ? "Se pornește…" : "PORNESC SPRE LOCAȚIE"}
    </button>
  );
}

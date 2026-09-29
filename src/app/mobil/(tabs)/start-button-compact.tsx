"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTravel } from "../lucrari/[id]/actions";

export function StartButtonCompact({
  jobId,
  jobTitle,
  address,
}: {
  jobId: string;
  jobTitle: string;
  address: string | null;
}) {
  const router = useRouter();
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
        startTransition(async () => {
          await startTravel(jobId);
          router.refresh();
        });
      }}
      className="flex-1 rounded-[10px] bg-success py-3 text-center text-[13.5px] font-bold text-white disabled:opacity-60"
    >
      {pending ? "…" : "START"}
    </button>
  );
}

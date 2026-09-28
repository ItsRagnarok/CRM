"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { arriveAtJob } from "./actions";

export function ArriveButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!navigator.geolocation) {
      startTransition(async () => {
        await arriveAtJob(jobId);
        router.refresh();
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          await arriveAtJob(jobId, pos.coords.latitude, pos.coords.longitude);
          router.refresh();
        });
      },
      () => {
        // No permission / no signal — still let them check in without coords.
        startTransition(async () => {
          await arriveAtJob(jobId);
          router.refresh();
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)] disabled:opacity-60"
    >
      {pending ? "Se confirmă…" : "AM AJUNS LA LOCAȚIE"}
    </button>
  );
}

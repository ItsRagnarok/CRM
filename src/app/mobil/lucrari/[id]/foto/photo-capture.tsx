"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { uploadJobPhoto } from "../actions";

export function PhotoCapture({ jobId, category }: { jobId: string; category: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("category", category);
    formData.set("file", file);
    startTransition(async () => {
      await uploadJobPhoto(formData);
      router.refresh();
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <label className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={pending}
      />
      <div
        className={`flex h-[74px] w-[74px] items-center justify-center rounded-full border-[5px] border-white/30 bg-white ${
          pending ? "opacity-60" : ""
        }`}
      >
        <Camera className="h-7 w-7 text-[#0b1530]" strokeWidth={1.8} />
      </div>
      <div className="text-[11px] font-semibold text-white/80">{pending ? "Se încarcă…" : "Fă o poză"}</div>
    </label>
  );
}

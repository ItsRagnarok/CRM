"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { runOrQueue } from "@/lib/offline/send";
import { useQueuedForJob } from "../job-footer";

/**
 * Pozele de pe camera telefonului au 3–8 MB. Le micșorăm la max. 2000 px (JPEG 82%):
 * se văd la fel de bine în dosar și pleacă de ~10 ori mai repede pe semnal slab.
 * Dacă browserul nu poate (format neobișnuit), trimitem originalul.
 */
async function shrink(file: File): Promise<Blob> {
  if (file.size < 1_200_000 || !("createImageBitmap" in window)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function PhotoCapture({ jobId, category }: { jobId: string; category: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const queued = useQueuedForJob(jobId).photos(category);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const takenAt = new Date().toISOString();
    setNotice(null);
    startTransition(async () => {
      try {
        const blob = await shrink(file);
        const name = blob === file ? file.name : file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
        const result = await runOrQueue({ kind: "photo", jobId, category, file: blob, fileName: name || "poza.jpg", takenAt });
        if (result.status === "error") {
          alert(result.error);
          return;
        }
        if (result.status === "queued") setNotice("Fără semnal: poza e salvată pe telefon și se trimite singură când revine semnalul.");
        router.refresh();
      } catch {
        alert("Nu am putut salva poza. Încearcă din nou.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
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
        <div className="text-[11px] font-semibold text-white/80">{pending ? "Se salvează…" : "Fă o poză"}</div>
      </label>
      {queued > 0 && (
        <div className="max-w-[300px] text-center text-[11.5px] font-semibold text-white/85">
          {queued === 1 ? "O poză salvată pe telefon" : `${queued} poze salvate pe telefon`}, se trimit când revine semnalul.
        </div>
      )}
      {notice && queued === 0 && <div className="max-w-[300px] text-center text-[11.5px] text-white/85">{notice}</div>}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, CloudOff, ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { runOrQueue } from "@/lib/offline/send";
import { PHOTO_CATEGORY_LABELS } from "@/lib/photo-tags";
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

type Local = { key: string; url: string; state: "sending" | "sent" | "queued" | "error"; error?: string };

/**
 * Încărcare în fundal: poza apare imediat pe ecran, iar tehnicianul poate face următoarea
 * fără să aștepte. Trimiterea (sau salvarea pe telefon, fără semnal) se face în spate.
 */
export function usePhotoUploader(jobId: string) {
  const router = useRouter();
  const [items, setItems] = useState<Local[]>([]);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = useCallback(
    (files: File[], category: string) => {
      for (const file of files) {
        const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        const takenAt = new Date().toISOString();
        setItems((list) => [...list, { key, url, state: "sending" }]);
        const update = (patch: Partial<Local>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
        void (async () => {
          try {
            const blob = await shrink(file);
            const name = blob === file ? file.name : file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
            const result = await runOrQueue({ kind: "photo", jobId, category, file: blob, fileName: name || "poza.jpg", takenAt });
            if (result.status === "error") update({ state: "error", error: result.error });
            else update({ state: result.status === "queued" ? "queued" : "sent" });
            if (result.status === "sent") router.refresh();
          } catch {
            update({ state: "error", error: "Nu am putut salva poza. Încearcă din nou." });
          }
        })();
      }
    },
    [jobId, router],
  );
  return { items, add };
}

function LocalThumbs({ items }: { items: Local[] }) {
  if (!items.length) return null;
  return (
    <div className="flex max-w-[320px] flex-wrap justify-center gap-2">
      {items.slice(-8).map((i) => (
        <div key={i.key} className="relative h-12 w-12 overflow-hidden rounded-[9px] bg-white/10" title={i.error}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.url} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-0.5 right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/70">
            {i.state === "sending" && <Loader2 className="h-3 w-3 animate-spin text-white" />}
            {i.state === "sent" && <Check className="h-3 w-3 text-[#8be39f]" />}
            {i.state === "queued" && <CloudOff className="h-3 w-3 text-[#f5c27a]" />}
            {i.state === "error" && <TriangleAlert className="h-3 w-3 text-[#ff8a80]" />}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PhotoCapture({ jobId, category }: { jobId: string; category: string }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { items, add } = usePhotoUploader(jobId);
  const queued = useQueuedForJob(jobId).photos(category);
  const sending = items.filter((i) => i.state === "sending").length;
  const failed = items.filter((i) => i.state === "error");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    if (files.length) add(files, category);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <LocalThumbs items={items} />
      <div className="flex items-center gap-8">
        <label className="flex flex-col items-center gap-1.5">
          <input ref={galleryRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><ImagePlus className="h-5 w-5 text-white" /></div>
          <div className="text-[10.5px] font-semibold text-white/70">Din galerie</div>
        </label>
        <label className="flex flex-col items-center gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFiles} className="hidden" />
          <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-[5px] border-white/30 bg-white">
            <Camera className="h-7 w-7 text-[#0b1530]" strokeWidth={1.8} />
          </div>
          <div className="text-[11px] font-semibold text-white/80">Fă o poză · {PHOTO_CATEGORY_LABELS[category] ?? category}</div>
        </label>
        <div className="w-12" />
      </div>
      {sending > 0 && <div className="text-[11.5px] text-white/75">Se trimite în fundal ({sending}). Poți face în continuare poze.</div>}
      {queued > 0 && (
        <div className="max-w-[300px] text-center text-[11.5px] font-semibold text-white/85">
          {queued === 1 ? "O poză salvată pe telefon" : `${queued} poze salvate pe telefon`}, se trimit când revine semnalul.
        </div>
      )}
      {failed.length > 0 && <div role="alert" className="max-w-[300px] text-center text-[11.5px] font-semibold text-[#ff8a80]">{failed[failed.length - 1].error}</div>}
    </div>
  );
}

/**
 * Poză în 2 atingeri, direct din pagina lucrării: o atingere deschide camera, a doua face poza.
 * Eticheta e aleasă după etapă (înainte / în lucru), iar trimiterea merge în fundal.
 */
export function QuickPhotoButton({ jobId, category }: { jobId: string; category: string }) {
  const { items, add } = usePhotoUploader(jobId);
  const last = items[items.length - 1];
  return (
    <label className="m-bt2 sm" style={{ flex: 1, cursor: "pointer" }}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, 1);
          if (files.length) add(files, category);
          e.target.value = "";
        }}
      />
      <Camera className="m-i" style={{ width: 18, height: 18 }} />
      {!last ? `Poză rapidă · ${PHOTO_CATEGORY_LABELS[category]}` : last.state === "sending" ? "Se trimite…" : last.state === "error" ? "Poza nu s-a salvat. Mai încearcă" : last.state === "queued" ? "Salvată pe telefon ✓ · încă una" : `Trimisă ✓ · încă una`}
    </label>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getMaterialIcon } from "@/app/(app)/materiale/standard-icons";

export function MaterialThumb({
  name,
  category,
  kind,
  unit,
  quantity,
  minStock,
  imageUrl,
}: {
  name: string;
  category: string | null;
  kind: string;
  unit: string;
  quantity: number;
  minStock: number;
  imageUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const Icon = getMaterialIcon(name, kind);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-neutral-bg"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5 text-muted-2" strokeWidth={1.7} />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-[20px] bg-white p-5 sm:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="text-[16px] font-extrabold">{name}</div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-neutral-bg p-1.5">
                <X className="h-4 w-4 text-[#344054]" />
              </button>
            </div>

            <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-neutral-bg">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name} className="h-full w-full object-contain" />
              ) : (
                <Icon className="h-16 w-16 text-muted-2" strokeWidth={1.4} />
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold text-muted-2">CATEGORIE</div>
                <div className="mt-0.5 font-bold">{category ?? "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-muted-2">TIP</div>
                <div className="mt-0.5 font-bold">{kind === "tool" ? "Sculă" : "Material"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-muted-2">STOC ÎN DUBĂ</div>
                <div className="mt-0.5 font-bold">
                  {quantity} {unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-muted-2">PRAG MINIM</div>
                <div className="mt-0.5 font-bold">
                  {minStock} {unit}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

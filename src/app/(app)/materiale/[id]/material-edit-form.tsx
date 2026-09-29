"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateMaterial, uploadMaterialImage, deleteMaterialImage } from "../actions";

type Material = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  min_stock: number;
  kind: "material" | "tool";
};

export function MaterialEditForm({ material, imageUrl }: { material: Material; imageUrl: string | null }) {
  const [pending, startTransition] = useTransition();
  const [imagePending, startImageTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => updateMaterial(material.id, formData));
  }

  function handleUpload(formData: FormData) {
    startImageTransition(() => uploadMaterialImage(material.id, formData));
  }

  function handleDeleteImage() {
    startImageTransition(() => deleteMaterialImage(material.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-border bg-white p-6">
        <div className="mb-1.5 text-[13px] font-semibold text-[#344054]">Fotografie</div>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#eaecf0] bg-neutral-bg">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={material.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] text-muted-2">Fără foto</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <form action={handleUpload} className="flex items-center gap-2">
              <input name="file" type="file" accept="image/*" required className="text-[12.5px]" />
              <button
                type="submit"
                disabled={imagePending}
                className="rounded-[9px] bg-neutral-bg px-3 py-1.5 text-[12px] font-bold text-[#344054] disabled:opacity-60"
              >
                {imagePending ? "…" : "Încarcă"}
              </button>
            </form>
            {imageUrl && (
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={imagePending}
                className="flex w-fit items-center gap-1 text-[11.5px] font-semibold text-danger"
              >
                <Trash2 className="h-3 w-3" /> Șterge fotografia
              </button>
            )}
          </div>
        </div>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6">
        <Field label="Nume">
          <input
            name="name"
            required
            defaultValue={material.name}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>
        <Field label="Tip">
          <select
            name="kind"
            defaultValue={material.kind}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-electric"
          >
            <option value="material">Material</option>
            <option value="tool">Sculă</option>
          </select>
        </Field>
        <Field label="Categorie">
          <input
            name="category"
            defaultValue={material.category ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unitate de măsură">
            <input
              name="unit"
              defaultValue={material.unit}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
          <Field label="Stoc minim">
            <input
              name="minStock"
              type="number"
              min={0}
              defaultValue={material.min_stock}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-fit rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează modificările"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">{label}</label>
      {children}
    </div>
  );
}

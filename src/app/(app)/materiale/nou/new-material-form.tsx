"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createMaterial } from "../actions";

const NEW_CATEGORY = "__new__";

export function NewMaterialForm({ categories }: { categories: string[] }) {
  const [state, formAction, pending] = useActionState(createMaterial, undefined);
  const [categoryChoice, setCategoryChoice] = useState(
    categories.length > 0 ? categories[0] : NEW_CATEGORY
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/materiale"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Material nou</h1>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6"
      >
        <Field label="Nume material sau sculă">
          <input
            name="name"
            required
            placeholder="Cablu MYYM 3x2.5"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <Field label="Categorie">
          <select
            value={categoryChoice}
            onChange={(e) => setCategoryChoice(e.target.value)}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ Categorie nouă…</option>
          </select>
          {categoryChoice === NEW_CATEGORY ? (
            <input
              name="category"
              placeholder="Ex: Automatizări"
              className="mt-2 w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          ) : (
            <input type="hidden" name="category" value={categoryChoice} />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Unitate de măsură">
            <input
              name="unit"
              defaultValue="buc"
              placeholder="buc, m, rolă…"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
          <Field label="Stoc minim">
            <input
              name="minStock"
              type="number"
              min={0}
              defaultValue={0}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
        </div>

        <Field label="Stoc inițial în depozitul central (opțional)">
          <input
            name="initialQty"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        {state?.error && <p className="text-sm font-medium text-danger">{state.error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/materiale"
            className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
          >
            Anulează
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "Se salvează…" : "Adaugă materialul"}
          </button>
        </div>
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

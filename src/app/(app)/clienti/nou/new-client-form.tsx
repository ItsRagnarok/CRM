"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createNewClient } from "../actions";

export function NewClientForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState(createNewClient, undefined);
  const error = state?.error ?? initialError;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6"
    >
      <Field label="Tip client">
        <select
          name="clientType"
          defaultValue="company"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
        >
          <option value="company">Companie</option>
          <option value="individual">Persoană fizică</option>
        </select>
      </Field>

      <Field label="Nume">
        <input
          name="name"
          required
          placeholder="SC Delta Construct SRL"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
        />
      </Field>

      <Field label="Nume companie (opțional, dacă diferă)">
        <input
          name="companyName"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CUI">
          <input
            name="cui"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>
        <Field label="Telefon">
          <input
            name="phone"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          name="email"
          type="email"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
        />
      </Field>

      <Field label="Adresă">
        <input
          name="address"
          placeholder="Str. Fabricii 12, București"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
        />
      </Field>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Link
          href="/clienti"
          className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
        >
          Anulează
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează clientul"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
        {label}
      </label>
      {children}
    </div>
  );
}

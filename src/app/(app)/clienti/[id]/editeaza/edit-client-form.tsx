"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateClient } from "../../actions";

type Client = {
  id: string;
  client_type: "company" | "individual";
  name: string;
  company_name: string | null;
  cui: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export function EditClientForm({ client }: { client: Client }) {
  const [state, formAction, pending] = useActionState(
    updateClient.bind(null, client.id),
    undefined
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href={`/clienti/${client.id}`}
          prefetch={false}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Editează client</h1>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6"
      >
        <Field label="Tip client">
          <select
            name="clientType"
            defaultValue={client.client_type}
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
            defaultValue={client.name}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <Field label="Nume companie (opțional, dacă diferă)">
          <input
            name="companyName"
            defaultValue={client.company_name ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="CUI">
            <input
              name="cui"
              defaultValue={client.cui ?? ""}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
          <Field label="Telefon">
            <input
              name="phone"
              defaultValue={client.phone ?? ""}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>
        </div>

        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <Field label="Adresă">
          <input
            name="address"
            defaultValue={client.address ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        {state?.error && <p className="text-sm font-medium text-danger">{state.error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/clienti/${client.id}`}
            prefetch={false}
            className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
          >
            Anulează
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "Se salvează…" : "Salvează modificările"}
          </button>
        </div>
      </form>
    </div>
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

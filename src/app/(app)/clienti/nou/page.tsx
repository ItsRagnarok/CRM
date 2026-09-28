import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/clienti"
          prefetch={false}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Client nou</h1>
      </div>

      <form
        action="/api/clients"
        method="post"
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
            prefetch={false}
            className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
          >
            Anulează
          </Link>
          <button
            type="submit"
            className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white"
          >
            Salvează clientul
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

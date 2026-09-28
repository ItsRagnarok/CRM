"use client";

import { useActionState } from "react";
import { updateOrganization } from "./actions";

export function CompanyForm({
  name,
  cui,
  email,
  phone,
  address,
}: {
  name: string;
  cui: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateOrganization, undefined);

  return (
    <form action={formAction} className="rounded-[13px] border border-border bg-white p-[22px]">
      <div className="mb-[18px] text-[15px] font-bold text-foreground">Informații companie</div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Denumire companie">
          <input
            name="name"
            required
            defaultValue={name}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
        </Field>
        <Field label="CUI">
          <input
            name="cui"
            defaultValue={cui ?? ""}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={email ?? ""}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
        </Field>
        <Field label="Telefon">
          <input
            name="phone"
            defaultValue={phone ?? ""}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
        </Field>
        <div className="col-span-2">
          <Field label="Adresă sediu">
            <input
              name="address"
              defaultValue={address ?? ""}
              className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
            />
          </Field>
        </div>
      </div>

      {state?.error && <p className="mt-3 text-[13px] font-medium text-danger">{state.error}</p>}
      {state?.success && <p className="mt-3 text-[13px] font-medium text-success">Salvat.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-[18px] rounded-[9px] bg-[#101828] px-[18px] py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {pending ? "Se salvează…" : "Salvează modificările"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-[#344054]">{label}</label>
      {children}
    </div>
  );
}

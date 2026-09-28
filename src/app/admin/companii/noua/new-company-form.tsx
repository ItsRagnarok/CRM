"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCompany } from "@/app/admin/actions";

export function NewCompanyForm() {
  const [state, formAction, pending] = useActionState(createCompany, undefined);

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link href="/admin/companii" className="mb-4 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#9b93b5]">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi la Companii
      </Link>
      <h1 className="text-[22px] font-extrabold text-[#17151f]">Companie nouă</h1>
      <p className="mt-1.5 text-[13.5px] text-[#5c5670]">
        Creezi organizația și contul de administrator al firmei client. Trimite-i credențialele — la prima
        logare poate schimba parola din Setări.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4 rounded-[14px] border border-[#e7e3f5] bg-white p-6">
        <Field label="Numele firmei">
          <input
            name="companyName"
            required
            placeholder="Ex: Ascent Electric SRL"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="CUI (opțional)">
          <input
            name="cui"
            placeholder="RO12345678"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>

        <div className="mt-2 border-t border-[#f2f0f9] pt-4">
          <div className="text-[12.5px] font-bold uppercase tracking-wide text-[#9b93b5]">
            Cont administrator firmă
          </div>
        </div>

        <Field label="Nume complet">
          <input
            name="ownerFullName"
            required
            placeholder="Ex: Andrei Popescu"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="Email">
          <input
            name="ownerEmail"
            type="email"
            required
            placeholder="andrei@ascent-electric.ro"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="Parolă temporară">
          <input
            name="ownerPassword"
            required
            minLength={6}
            placeholder="Minim 6 caractere"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>

        {state?.error && (
          <div className="rounded-[10px] bg-danger-bg px-3.5 py-2.5 text-[13px] font-semibold text-danger">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-[10px] bg-purple py-3 text-center text-[14px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Se creează…" : "Creează compania"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-semibold text-[#5c5670]">{label}</div>
      {children}
    </div>
  );
}

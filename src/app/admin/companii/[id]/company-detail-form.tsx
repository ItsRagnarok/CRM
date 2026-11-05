"use client";

import { useState, useTransition } from "react";
import { updateCompany, deleteCompany } from "@/app/admin/actions";

type Company = {
  id: string;
  name: string;
  cui: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  subscription_plan: string;
  is_active: boolean;
};

export function CompanyDetailForm({ company }: { company: Company }) {
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [access, setAccess] = useState(company.is_active ? "active" : "suspended");

  function handleSubmit(formData: FormData) {
    setSaveMessage("");
    startTransition(async () => {
      const result = await updateCompany(company.id, formData);
      setSaveMessage(result.error ?? "Modificările au fost salvate.");
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteCompany(company.id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  return (
    <>
    <form action={handleSubmit} className="flex flex-col gap-4 rounded-[14px] border border-[#e7e3f5] bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Numele firmei">
          <input
            name="companyName"
            required
            defaultValue={company.name}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="CUI">
          <input
            name="cui"
            defaultValue={company.cui ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={company.email ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
        <Field label="Telefon">
          <input
            name="phone"
            defaultValue={company.phone ?? ""}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
          />
        </Field>
      </div>
      <Field label="Adresă">
        <input
          name="address"
          defaultValue={company.address ?? ""}
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-purple"
        />
      </Field>

      <div className="grid gap-4 border-t border-[#f2f0f9] pt-4 sm:grid-cols-2">
        <Field label="Abonament">
          <p className="text-sm font-bold">ElectroField · 599 lei / lună</p>
          <p className="mt-1 text-xs text-muted">Per companie · Fără TVA</p>
        </Field>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Acces la platformă
          <select name="access" value={access} onChange={(event) => setAccess(event.target.value)} disabled={pending} className="rounded-[10px] border border-border bg-white px-3 py-2.5">
            <option value="active">Activ</option>
            <option value="suspended">Suspendat</option>
          </select>
          <span className="text-xs font-normal text-muted">Suspendarea blochează accesul tuturor utilizatorilor companiei. Datele sunt păstrate. Modificarea se aplică după salvare.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-[10px] bg-purple px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
      >
        {pending ? "Se salvează…" : "Salvează modificările"}
      </button>
      {saveMessage && <p role="status" className="text-sm">{saveMessage}</p>}
    </form>

    <div className="mt-6 rounded-[14px] border border-danger-bg bg-danger-bg/30 p-6">
      <div className="text-[14px] font-bold text-danger">Zonă periculoasă</div>
      <p className="mt-1 text-[12.5px] text-[#5c5670]">
        Șterge definitiv compania, toți utilizatorii, lucrările, materialele și datele asociate. Nu
        poate fi anulat.
      </p>

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-3.5 rounded-[10px] border border-danger px-4 py-2.5 text-[13px] font-bold text-danger"
        >
          Șterge compania
        </button>
      ) : (
        <div className="mt-3.5 flex flex-col gap-2.5">
          <label className="text-[12.5px] font-semibold text-[#5c5670]">
            Scrie <span className="font-bold text-danger">{company.name}</span> pentru a confirma:
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full max-w-sm rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[14px] outline-none focus:border-danger"
          />
          {deleteError && <div className="text-[12.5px] font-semibold text-danger">{deleteError}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={confirmText !== company.name || deletePending}
              onClick={handleDelete}
              className="rounded-[10px] bg-danger px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {deletePending ? "Se șterge…" : "Confirmă ștergerea definitivă"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText("");
                setDeleteError(null);
              }}
              className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold text-muted"
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </div>
    </>
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

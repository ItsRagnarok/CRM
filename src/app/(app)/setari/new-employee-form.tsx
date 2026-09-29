"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createEmployee } from "./actions";

const ROLE_OPTIONS = [
  { value: "technician", label: "Tehnician" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Administrator companie" },
];

export function NewEmployeeForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createEmployee, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-[9px] bg-electric px-3.5 py-2 text-[12.5px] font-bold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Adaugă angajat
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-[12px] border border-[#eaecf0] bg-neutral-bg p-4"
    >
      <div className="text-[13px] font-bold text-foreground">Cont nou de angajat</div>
      <p className="text-[12px] text-muted-2">
        Creezi contul cu care angajatul se loghează în aplicația mobilă. Trimite-i email-ul și parola —
        le poate schimba ulterior.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="fullName"
          required
          placeholder="Nume complet"
          className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
        />
        <select
          name="role"
          defaultValue="technician"
          className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] font-semibold outline-none focus:border-electric"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
        />
        <input
          name="password"
          required
          minLength={6}
          placeholder="Parolă temporară (min. 6 caractere)"
          className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
        />
      </div>

      {state?.error && (
        <div className="rounded-[8px] bg-danger-bg px-3 py-2 text-[12.5px] font-semibold text-danger">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-[8px] bg-success-bg px-3 py-2 text-[12.5px] font-semibold text-success">
          Cont creat. Trimite-i angajatului email-ul și parola.
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[9px] bg-electric px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Se creează…" : "Creează contul"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-muted"
        >
          Anulează
        </button>
      </div>
    </form>
  );
}

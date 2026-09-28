"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createTeam } from "../actions";

export default function NewTeamPage() {
  const [state, formAction, pending] = useActionState(createTeam, undefined);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/echipe"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Echipă nouă</h1>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6"
      >
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
            Nume echipă
          </label>
          <input
            name="name"
            required
            placeholder="Echipa Nord"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </div>

        <p className="text-[12.5px] text-muted">
          Adaugi membri și lider imediat după ce echipa e creată.
        </p>

        {state?.error && (
          <p className="text-sm font-medium text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/echipe"
            className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
          >
            Anulează
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "Se creează…" : "Creează echipa"}
          </button>
        </div>
      </form>
    </div>
  );
}

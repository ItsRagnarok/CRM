"use client";

import { useActionState, useState } from "react";
import { updateEmployeeEmail, resetEmployeePassword } from "./actions";

export function AccountForm({ profileId, email }: { profileId: string; email: string }) {
  const updateEmailAction = updateEmployeeEmail.bind(null, profileId);
  const resetPasswordAction = resetEmployeePassword.bind(null, profileId);
  const [emailState, emailFormAction, emailPending] = useActionState(updateEmailAction, undefined);
  const [pwState, pwFormAction, pwPending] = useActionState(resetPasswordAction, undefined);
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className="mt-6 rounded-[13px] border border-border bg-white p-5">
      <h2 className="text-[14.5px] font-bold text-foreground">Cont de logare</h2>
      <p className="mb-3.5 mt-0.5 text-[12px] text-muted-2">
        Emailul și parola cu care se loghează în aplicația mobilă.
      </p>

      <form action={emailFormAction} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[#344054]">Email</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={email}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
          />
        </div>
        <button
          type="submit"
          disabled={emailPending}
          className="rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054] disabled:opacity-60"
        >
          {emailPending ? "Se salvează…" : "Salvează"}
        </button>
      </form>
      {emailState?.error && (
        <p className="mt-2 text-[12.5px] font-semibold text-danger">{emailState.error}</p>
      )}
      {emailState?.success && (
        <p className="mt-2 text-[12.5px] font-semibold text-success">Email actualizat.</p>
      )}

      <div className="mt-4 border-t border-[#f2f4f7] pt-4">
        <p className="mb-2 text-[12px] text-muted-2">
          Parola nu poate fi afișată — nu e stocată în formă recuperabilă. Poți doar seta una nouă.
        </p>
        {!pwOpen ? (
          <button
            type="button"
            onClick={() => setPwOpen(true)}
            className="rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
          >
            Resetează parola
          </button>
        ) : (
          <form action={pwFormAction} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#344054]">
                Parolă nouă
              </label>
              <input
                name="password"
                required
                minLength={6}
                placeholder="Min. 6 caractere"
                className="w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
              />
            </div>
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-[9px] bg-electric px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
            >
              {pwPending ? "Se salvează…" : "Setează"}
            </button>
            <button
              type="button"
              onClick={() => setPwOpen(false)}
              className="rounded-[9px] px-3.5 py-2 text-[12.5px] font-bold text-muted"
            >
              Anulează
            </button>
          </form>
        )}
        {pwState?.error && (
          <p className="mt-2 text-[12.5px] font-semibold text-danger">{pwState.error}</p>
        )}
        {pwState?.success && (
          <p className="mt-2 text-[12.5px] font-semibold text-success">
            Parolă resetată. Trimite-i angajatului parola nouă.
          </p>
        )}
      </div>
    </div>
  );
}

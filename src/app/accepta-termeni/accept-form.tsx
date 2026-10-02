"use client";

import { useState, useTransition } from "react";
import { acceptTerms, declineTerms } from "./actions";

export function AcceptTermsForm() {
  const [checked, setChecked] = useState(false);
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [acceptPending, startAccept] = useTransition();
  const [declinePending, startDecline] = useTransition();

  const pending = acceptPending || declinePending;

  return (
    <div className="sticky bottom-0 mt-6 border-t border-border bg-white pt-4">
      <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] font-semibold text-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#2f6fed]"
        />
        Am citit și sunt de acord, în numele companiei, cu Termenii și condițiile de mai sus.
      </label>

      {!confirmingDecline ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={!checked || pending}
            onClick={() => startAccept(() => acceptTerms())}
            className="rounded-[10px] bg-[#101828] px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-40"
          >
            {acceptPending ? "Se salvează…" : "Accept și continuă"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingDecline(true)}
            className="rounded-[10px] border border-[#d0d5dd] px-5 py-2.5 text-[13.5px] font-bold text-[#344054] disabled:opacity-40"
          >
            Refuz
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5 rounded-[10px] border border-danger-bg bg-danger-bg/40 p-4">
          <p className="text-[13px] font-semibold text-danger">
            Dacă refuzi, contul companiei va fi suspendat imediat și niciun utilizator din organizație nu va mai
            putea accesa platforma, până la o nouă acceptare. Confirmi?
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={declinePending}
              onClick={() => startDecline(() => declineTerms())}
              className="rounded-[10px] bg-danger px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {declinePending ? "Se procesează…" : "Da, refuz și suspendă contul"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDecline(false)}
              className="rounded-[10px] px-4 py-2 text-[13px] font-bold text-muted"
            >
              Renunță
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

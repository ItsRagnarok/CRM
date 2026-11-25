"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { requestRestock } from "./actions";

/** „Cere reaprovizionare”: confirmarea apare pe loc, fără să reîncarce ecranul. */
export function RestockForm({ vehicleId, count }: { vehicleId: string; count: number }) {
  const [state, action, pending] = useActionState(requestRestock, undefined);
  if (state?.ok) return <div className="mt-2.5 rounded-[10px] bg-[#fef9ec] px-3 py-2 text-[12px] font-bold text-[#b45309]">Cerere trimisă</div>;
  return (
    <form action={action} className="mt-2.5 flex flex-col gap-2">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input name="note" maxLength={500} placeholder="Altceva? (opțional, ex. 2 role de cablu 3x1,5)" className="rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13px]" />
      <button type="submit" disabled={pending} className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[#1f2024] py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
        <Send className="h-3.5 w-3.5" /> {pending ? "Se trimite…" : `Cere reaprovizionare${count ? ` (${count})` : ""}`}
      </button>
      {state?.error && <p role="alert" className="text-[12px] font-semibold text-danger">{state.error}</p>}
    </form>
  );
}

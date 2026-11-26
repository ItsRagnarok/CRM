"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { syncAction, type ActionState } from "./actions";

export function SyncButton({ label }: { label: string }) {
  const [state, action, pending] = useActionState<ActionState | undefined, FormData>(syncAction, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <button type="submit" disabled={pending} title={`Aduce de la ${label} încasările și starea e-Factura pentru facturile deschise`}
        className="flex h-10 items-center gap-2 rounded-[11px] border border-border bg-white px-3.5 text-[13px] font-bold disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sincronizează cu {label}
      </button>
      {state?.error && <span role="alert" className="max-w-[340px] text-right text-[12px] font-semibold text-danger">{state.error}</span>}
      {state?.ok && <span role="status" className="max-w-[340px] text-right text-[12px] font-semibold text-success">{state.ok}</span>}
    </form>
  );
}

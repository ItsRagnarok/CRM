"use client";

import { useActionState } from "react";
import { requestDemoOffer } from "@/app/(app)/demo-actions";

export function OfferButton({ feature }: { feature: string }) {
  const [state, action, pending] = useActionState(requestDemoOffer, undefined);
  if (state?.sent) return <span role="status" className="rounded-[11px] bg-success-bg px-3 py-2.5 text-[13px] font-bold text-success">Am primit cererea. Te sunăm noi.</span>;
  return (
    <form action={action} className="contents">
      <input type="hidden" name="feature" value={feature} />
      <button type="submit" disabled={pending} className="rounded-[11px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[14px] font-bold text-[#344054] disabled:opacity-60">
        {pending ? "Se trimite…" : "Cere ofertă"}
      </button>
      {state?.error && <span role="alert" className="basis-full text-[12.5px] font-semibold text-danger">{state.error}</span>}
    </form>
  );
}

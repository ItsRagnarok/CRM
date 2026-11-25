"use client";

import { useActionState } from "react";
import { confirmTraining } from "@/app/mobil/ssm/actions";

/** „Confirm că am fost instruit” — o singură dată, pe fiecare instruire. */
export function ConfirmTraining({ id }: { id: string }) {
  const [state, action, pending] = useActionState(confirmTraining, undefined);
  if (state?.ok) return <div className="m-note ac" role="status">Ai confirmat. Biroul vede confirmarea în evidență.</div>;
  return (
    <form action={action} style={{ display: "grid", gap: 6 }}>
      <input type="hidden" name="id" value={id} />
      <button className="m-btn" disabled={pending}>{pending ? "Se trimite…" : "Confirm că am fost instruit"}</button>
      {state?.error && <div role="alert" className="m-note warn">{state.error}</div>}
    </form>
  );
}

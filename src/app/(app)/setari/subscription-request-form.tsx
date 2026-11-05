"use client";

import { useActionState, useState } from "react";
import { submitSubscriptionRequest } from "./subscription-request-actions";

export function SubscriptionRequestForm() {
  const [kind, setKind] = useState("feature");
  const [state, action, pending] = useActionState(submitSubscriptionRequest, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Tipul cererii
        <select name="kind" value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2">
          <option value="feature">Funcție nouă sau upgrade</option>
          <option value="cancellation">Anularea abonamentului</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {kind === "feature" ? "Ce funcție sau modificare îți trebuie?" : "Motivul anulării (opțional)"}
        <textarea name="details" required={kind === "feature"} rows={4} maxLength={3000} className="rounded-lg border border-border bg-white px-3 py-2 font-normal" />
      </label>
      {kind === "cancellation" && <p className="text-sm text-muted">Administratorul platformei va procesa cererea și îți va confirma data de încetare a abonamentului.</p>}
      <button disabled={pending} className="self-start rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "Se trimite…" : kind === "feature" ? "Solicită o ofertă" : "Solicită anularea"}
      </button>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.sent && <p role="status" className="text-sm text-success">Cererea a fost trimisă administratorului platformei.</p>}
    </form>
  );
}

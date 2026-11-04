"use client";

import { useActionState, useState } from "react";
import type { defaultConfirmation } from "@/lib/booking-confirmation";
import { sendPersonalConfirmation } from "./confirmation-actions";

export function PersonalConfirmation({ id, email, template }: { id: string; email: string; template: typeof defaultConfirmation }) {
  const [state, action, pending] = useActionState(sendPersonalConfirmation.bind(null, id), {});
  const [subject, setSubject] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [meet, setMeet] = useState("");
  const field = "block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm";
  return (
    <details className="basis-full rounded-lg border border-border p-3">
      <summary className="cursor-pointer font-semibold text-purple">Trimite confirmare sau link Google Meet</summary>
      <form action={action} className="mt-3 space-y-3">
        <p className="text-muted">Destinatar: {email}</p>
        <label className="block">Subiect<input name="subject" className={field} value={subject ?? template.subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} required /></label>
        <label className="block">Mesaj<textarea name="message" className={field} value={message ?? template.message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={3000} required /></label>
        <label className="block">Link Google Meet (opțional)<input name="meet" type="url" className={field} value={meet} onChange={(event) => setMeet(event.target.value)} placeholder="https://meet.google.com/abc-defg-hij" maxLength={200} /></label>
        <button disabled={pending} className="rounded-lg bg-purple px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Se trimite…" : "Trimite clientului"}</button>
        {state.error && <p role="alert" className="text-danger">{state.error}</p>}
        {state.sent && <p role="status" className="text-success">Mesajul a fost acceptat de serverul de email.</p>}
      </form>
    </details>
  );
}

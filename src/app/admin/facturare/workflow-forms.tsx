"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Form, Field, input } from "./forms";
import {
  quickClient,
  correctRejected,
  retryIssue,
  createCredit,
  recordPayment,
} from "./invoice-actions";
import { primary } from "./ui";
import { todayRo } from "@/lib/billing/money";
export function QuickClient() {
  const [state, action, pending] = useActionState(quickClient, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="cui"
          aria-label="CUI client nou"
          className={input + " mt-0 min-w-0 text-foreground"}
          placeholder="RO12345678"
          required
          maxLength={20}
        />
        <button disabled={pending} className={primary}>
          {pending ? "Se caută…" : "Adaugă"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm">
          {state.success}
        </p>
      )}
      {state?.clientId && (
        <Link
          href={`/admin/facturare/clienti/${state.clientId}`}
          className="inline-block text-sm font-bold underline"
        >
          Deschide clientul →
        </Link>
      )}
    </form>
  );
}
export function IssueForm({
  id,
  pending = false,
  credit = false,
}: {
  id: string;
  pending?: boolean;
  credit?: boolean;
}) {
  return (
    <Form
      action={retryIssue}
      button={
        pending
          ? "Verifică / reia aceeași cerere"
          : credit
            ? "Emite stornarea în Oblio"
            : "Emite în Oblio"
      }
    >
      <input type="hidden" name="id" value={id} />
      {!pending && (
        <label className="flex items-center gap-2 text-sm">
          <input name="sendEmail" type="checkbox" />
          Trimite și prin e-mail din Oblio
        </label>
      )}
      {pending && (
        <p className="text-sm text-muted">
          Reîncercarea păstrează cheia unică a documentului. Nu crea o factură
          nouă pentru aceeași emitere.
        </p>
      )}
    </Form>
  );
}
export function CreditForm({ id }: { id: string }) {
  return (
    <Form action={createCredit} button="Pregătește stornarea integrală">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted">
        Se creează o ciornă cu toate liniile inversate. Încasările existente
        rămân în istoric; restituirea se înregistrează separat.
      </p>
    </Form>
  );
}
export function PaymentForm({
  id,
  balance,
  paymentId,
}: {
  id: string;
  balance: string;
  paymentId: string;
}) {
  return (
    <Form key={balance} action={recordPayment} button="Salvează încasarea">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="amount" label="Sumă (lei)" value={balance} required />
        <Field
          name="date"
          label="Data încasării"
          type="date"
          value={todayRo()}
          required
        />
      </div>
      <label className="block text-sm">
        Metodă
        <select name="method" className={input}>
          <option value="bank">Transfer bancar</option>
          <option value="cash">Numerar</option>
          <option value="card">Card</option>
          <option value="other">Altă metodă</option>
        </select>
      </label>
      <p className="text-xs text-muted">
        Înregistrare în evidența ElectroField. Nu inițiază o plată bancară și nu
        creează chitanță în Oblio.
      </p>
    </Form>
  );
}

export function CorrectionForm({ id }: { id: string }) {
  return (
    <Form action={correctRejected} button="Corectează ciorna refuzată">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted">
        Oblio a refuzat cererea fără emitere. Poți corecta datele și încerca din
        nou.
      </p>
    </Form>
  );
}

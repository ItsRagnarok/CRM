"use client";
import { useActionState } from "react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveCompany,
  saveClient,
  saveBank,
  saveSeries,
  connectOblio,
  type BillingState,
} from "./actions";

type Tables = Database["public"]["Tables"];
const input =
  "mt-1 block w-full rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-purple";
export function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
  maxLength = 500,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className={input}
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        maxLength={maxLength}
        autoComplete={type === "password" ? "new-password" : undefined}
      />
    </label>
  );
}
function Form({
  action,
  children,
  button,
}: {
  action: (state: BillingState, data: FormData) => Promise<BillingState>;
  children: React.ReactNode;
  button: string;
}) {
  const [state, submit, pending] = useActionState(action, undefined);
  return (
    <form action={submit} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
        {children}
      </fieldset>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-[10px] bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Se verifică și se salvează…" : button}
      </button>
    </form>
  );
}
export function CompanyForm({
  company: c,
}: {
  company: Tables["billing_company_settings"]["Row"] | null;
}) {
  return (
    <Form action={saveCompany} button="Salvează datele firmei">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Denumirea firmei" value={c?.name} required />
        <Field name="cui" label="CUI" value={c?.cui} required maxLength={20} />
        <Field
          name="registration"
          label="Număr registrul comerțului"
          value={c?.registration_number}
        />
        <Field
          name="address"
          label="Adresa completă"
          value={c?.address}
          required
        />
        <Field name="email" label="E-mail" type="email" value={c?.email} />
        <Field name="phone" label="Telefon" value={c?.phone} />
        <Field
          name="vat"
          label="Cota TVA implicită (%)"
          value={c?.default_vat_rate ?? 21}
          required
          maxLength={6}
        />
        <Field
          name="due"
          label="Termen de plată (zile)"
          value={c?.default_due_days ?? 7}
          required
          maxLength={3}
        />
        <Field
          name="accountant"
          label="E-mail contabil"
          type="email"
          value={c?.accountant_email}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="vatPayer"
          defaultChecked={c?.vat_payer ?? true}
        />
        Firma este plătitoare de TVA
      </label>
    </Form>
  );
}
export function ClientForm({
  client: c,
}: {
  client?: Tables["billing_clients"]["Row"] | null;
}) {
  return (
    <Form
      action={saveClient}
      button={c ? "Salvează modificările" : "Adaugă client"}
    >
      <input name="id" type="hidden" value={c?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="cui"
          label="CUI (opțional pentru persoane fizice)"
          value={c?.cui}
          maxLength={20}
        />
        <Field name="name" label="Nume / denumire" value={c?.name} />
        <label className="text-sm font-semibold">
          Tip client
          <select
            name="type"
            defaultValue={c?.client_type ?? "company"}
            className={input}
          >
            <option value="company">Firmă / PFA</option>
            <option value="person">Persoană fizică</option>
          </select>
        </label>
        <Field name="email" label="E-mail" type="email" value={c?.email} />
        <Field name="phone" label="Telefon" value={c?.phone} />
        <Field name="address" label="Adresa" value={c?.address} />
        <Field name="city" label="Localitate" value={c?.city} />
        <Field name="county" label="Județ" value={c?.county} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="vatPayer"
          defaultChecked={c?.vat_payer ?? false}
        />
        Client plătitor de TVA
      </label>
      <p className="text-xs text-muted">
        Poți salva clientul doar cu CUI. Completează datele fiscale înainte de
        emitere.
      </p>
    </Form>
  );
}
export function SeriesForm() {
  return (
    <Form action={saveSeries} button="Salvează seria">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Seria din Oblio" required maxLength={50} />
        <label className="text-sm font-semibold">
          Tip document
          <select name="kind" className={input}>
            <option value="invoice">Factură</option>
            <option value="proforma">Proformă</option>
            <option value="credit_note">Stornare</option>
          </select>
        </label>
      </div>
    </Form>
  );
}
export function BankForm() {
  return (
    <Form action={saveBank} button="Salvează contul">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="bank" label="Bancă" required />
        <Field name="iban" label="IBAN" required maxLength={40} />
      </div>
    </Form>
  );
}
export function OblioForm({
  email,
  series,
}: {
  email?: string;
  series: string[];
}) {
  return (
    <Form action={connectOblio} button="Verifică și conectează Oblio">
      <Field
        name="email"
        label="E-mail cont Oblio"
        type="email"
        value={email}
        required
      />
      <Field
        name="secret"
        label="Client Secret"
        type="password"
        required
        maxLength={4096}
      />
      <label className="block text-sm font-semibold">
        Seria de facturi de verificat
        <select className={input} name="series" required>
          <option value="">Alege seria</option>
          {series.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-relaxed text-muted">
        Client Secret se găsește în contul Oblio, la Setări → Date cont.
        Verificarea nu emite facturi.
      </p>
    </Form>
  );
}

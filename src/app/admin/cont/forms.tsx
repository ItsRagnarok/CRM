"use client";

import { useActionState } from "react";
import { changeAdminPassword, transferSuperAdmin } from "./actions";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric";
const label = "mb-1.5 block text-[13px] font-semibold text-[#344054]";

function Message({ state }: { state: { error?: string; success?: string } | undefined }) {
  if (state?.error) return <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>;
  if (state?.success) return <p className="text-sm font-medium text-green-700" role="status">{state.success}</p>;
  return null;
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPassword, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <div><label className={label}>Parola curentă</label><input name="current" type="password" autoComplete="current-password" required className={input} /></div>
      <div><label className={label}>Parola nouă</label><input name="next" type="password" autoComplete="new-password" minLength={12} required className={input} /></div>
      <div><label className={label}>Repetă parola nouă</label><input name="repeat" type="password" autoComplete="new-password" minLength={12} required className={input} /></div>
      <Message state={state} />
      <button disabled={pending} className="self-start rounded-[10px] bg-electric px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Se salvează…" : "Schimbă parola"}
      </button>
    </form>
  );
}

export function TransferForm() {
  const [state, action, pending] = useActionState(transferSuperAdmin, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <div><label className={label}>Numele noului administrator</label><input name="fullName" autoComplete="off" required className={input} /></div>
      <div><label className={label}>Adresa de email nouă</label><input name="email" type="email" autoComplete="off" placeholder="admin@electrofield.ro" required className={input} /></div>
      <div><label className={label}>Repetă adresa de email</label><input name="confirmEmail" type="email" autoComplete="off" required className={input} /></div>
      <div><label className={label}>Parola ta curentă (confirmare)</label><input name="current" type="password" autoComplete="current-password" required className={input} /></div>
      <Message state={state} />
      <button disabled={pending} className="self-start rounded-[10px] bg-danger px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Se transferă…" : "Transferă rolul și deconectează-mă"}
      </button>
    </form>
  );
}

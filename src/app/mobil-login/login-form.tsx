"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/app/login/actions";

export function MobileLoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="mt-9 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="m-lb">Email</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" required className="m-in" placeholder="nume@firma.ro" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="m-lb">Parolă</label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="m-in pr-12" placeholder="••••••••" />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ascunde parola" : "Arată parola"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--m-mu)]">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {state?.error && <p role="alert" className="m-note bad text-[14px] font-semibold">{state.error}</p>}
      <button type="submit" disabled={pending} className="m-btn">
        {pending ? "Se conectează…" : "Intră în cont"}
      </button>
    </form>
  );
}

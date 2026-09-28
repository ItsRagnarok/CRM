"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signup } from "./actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-white p-10 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="flex items-baseline text-lg font-extrabold tracking-tight text-foreground">
            Electro
            <Image
              src="/logo-wordmark-field.png"
              alt="Field"
              width={496}
              height={173}
              className="h-[18px] w-auto translate-y-[1px] object-contain"
            />
          </span>
        </div>

        <h2 className="text-[22px] font-bold text-foreground">Creează organizația ta</h2>
        <p className="mt-1.5 text-sm text-muted">
          Un cont, o companie. Poți invita colegi ulterior din Setări.
        </p>

        <form action={formAction} className="mt-7 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
              Numele companiei
            </label>
            <input
              name="orgName"
              required
              placeholder="Electro Pro Solutions SRL"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
              Numele tău
            </label>
            <input
              name="fullName"
              required
              placeholder="Andrei Popescu"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="tu@companie.ro"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
              Parolă
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minim 6 caractere"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </div>

          {state?.error && (
            <p className="text-sm font-medium text-danger">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-[10px] bg-electric py-3 text-[15px] font-bold text-white shadow-[0_4px_10px_rgba(59,130,246,0.28)] disabled:opacity-60"
          >
            {pending ? "Se creează…" : "Creează contul"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Ai deja cont?{" "}
          <Link href="/login" className="font-semibold text-electric">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
}

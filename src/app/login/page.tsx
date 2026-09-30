"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";
import { Users, Camera, FileText, Smartphone } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-[46%] flex-col justify-between bg-gradient-to-br from-[#1c1c22] via-[#202027] to-[#26262e] p-14 text-white">
        <div className="flex items-center gap-3">
          <Image src="/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="flex items-baseline text-xl font-extrabold tracking-tight">
            Electro
            <Image
              src="/logo-wordmark-field.png"
              alt="Field"
              width={496}
              height={173}
              className="h-[20px] w-auto translate-y-[1px] object-contain"
            />
          </span>
        </div>

        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Echipă. Lucrări. Control.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] text-[#b4b6be]">
            Sistemul central de operare pentru firmele cu echipe pe teren:
            electricieni, CCTV, securitate, mentenanță.
          </p>

          <div className="mt-9 flex flex-col gap-4">
            {[
              { icon: Users, text: "Vezi în timp real unde sunt echipele și la ce lucrare" },
              { icon: Camera, text: "Fotografii, checklist-uri și semnătură client pentru fiecare lucrare" },
              { icon: FileText, text: "Raport PDF automat la finalizarea fiecărei lucrări" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-[#dcdde1]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#9da0a8]">© 2026 ElectroField</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-[400px] rounded-2xl border border-border bg-white p-10 shadow-sm">
          <h2 className="text-[22px] font-bold text-foreground">Bine ai revenit</h2>
          <p className="mt-1.5 text-sm text-muted">
            Autentifică-te în contul ElectroField
          </p>

          <form action={formAction} className="mt-7 flex flex-col gap-4">
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
                placeholder="••••••••"
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
              {pending ? "Se conectează…" : "Intră în cont"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Nu ai cont?{" "}
            <Link href="/signup" className="font-semibold text-electric">
              Creează organizația ta
            </Link>
          </p>

          <a
            href="/downloads/electrofield.apk"
            download
            className="mt-4 flex items-center justify-center gap-2 rounded-[10px] border border-[#d0d5dd] py-2.5 text-[13.5px] font-semibold text-[#344054] transition-colors hover:bg-neutral-bg"
          >
            <Smartphone className="h-4 w-4" strokeWidth={2} />
            Descarcă aplicația Android
          </a>
        </div>
      </div>
    </div>
  );
}

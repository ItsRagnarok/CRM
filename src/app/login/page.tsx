"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import { login } from "./actions";
import { ANDROID_APK_URL, ANDROID_APP_VERSION } from "@/lib/android-release";
import { CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL } from "@/lib/contact";

const POINTS = [
  ["Scadențe care nu se uită", "verificări, legitimații, termene ale operatorului"],
  ["Dosar complet pe fiecare lucrare", "poze, măsurători, semnături, documente"],
  ["Banii urmăriți până la încasare", "avansuri, facturi, restanțe, marjă"],
] as const;

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#07090a] text-[#f4f7f4]" style={{ colorScheme: "dark" }}>
      <div className="relative hidden flex-[1.05] flex-col justify-between overflow-hidden p-14 lg:flex" style={{ background: "radial-gradient(700px 500px at 70% 20%, rgba(198,255,74,.16), transparent 60%), linear-gradient(160deg,#0c110f,#07090a)" }}>
        <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="block h-[30px] w-[30px] rounded-[9px] bg-[#c6ff4a]" aria-hidden />
          ElectroField
        </Link>
        <div>
          <h1 className="max-w-[560px] text-[44px] font-extrabold leading-[1.05] tracking-tight">
            Lucrările firmei tale, <span className="text-[#c6ff4a]">sub control.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-[#aab3ac]">
            Biroul și echipele din teren, într-un singur loc: electrice, gaze, fotovoltaice. Fără caiete, fără poze pierdute în grupuri.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {POINTS.map(([title, text], i) => (
              <li key={title} className="flex items-start gap-3 text-[14.5px]">
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[rgba(198,255,74,.15)] text-[12px] font-extrabold text-[#c6ff4a]">{i + 1}</span>
                <span><b className="font-bold">{title}</b><br /><span className="text-[#aab3ac]">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-[#656f68]">© 2026 ElectroField</p>
      </div>

      <div className="flex flex-1 items-center justify-center border-l border-white/[.08] bg-[#0b100e] p-6">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-8 flex items-center gap-2.5 text-lg font-extrabold lg:hidden">
            <span className="block h-[26px] w-[26px] rounded-[8px] bg-[#c6ff4a]" aria-hidden />
            ElectroField
          </Link>
          <h2 className="text-[28px] font-extrabold tracking-tight">Bine ai revenit</h2>
          <p className="mb-7 mt-1.5 text-[14.5px] text-[#aab3ac]">Intră în contul firmei tale.</p>

          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[#aab3ac]">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" placeholder="tu@firma.ro"
                className="h-12 w-full rounded-xl border border-white/[.14] bg-[#07090a] px-3.5 text-[14.5px] text-[#f4f7f4] outline-none placeholder:text-[#656f68] focus:border-[#c6ff4a] focus:shadow-[0_0_0_3px_rgba(198,255,74,.14)]" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#aab3ac]">Parolă</label>
              <div className="relative">
                <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/[.14] bg-[#07090a] px-3.5 pr-12 text-[14.5px] text-[#f4f7f4] outline-none placeholder:text-[#656f68] focus:border-[#c6ff4a] focus:shadow-[0_0_0_3px_rgba(198,255,74,.14)]" />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ascunde parola" : "Arată parola"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#aab3ac] hover:text-white">
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {state?.error && <p role="alert" className="rounded-xl bg-[rgba(255,138,128,.12)] px-3.5 py-2.5 text-sm font-medium text-[#ff8a80]">{state.error}</p>}

            <button type="submit" disabled={pending}
              className="mt-2 h-[50px] rounded-full bg-[#c6ff4a] text-[15px] font-extrabold text-[#0a0d0a] shadow-[0_10px_30px_-12px_rgba(198,255,74,.6)] transition-transform hover:-translate-y-px disabled:opacity-60">
              {pending ? "Se conectează…" : "Intră în cont"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] leading-relaxed text-[#aab3ac]">
            Contul îl creează echipa ElectroField pentru firma ta. Nu-l ai sau ai uitat parola? Scrie-ne pe{" "}
            <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#c6ff4a]">WhatsApp {CONTACT_PHONE_DISPLAY}</a>.
          </p>

          <a href={ANDROID_APK_URL} download className="mt-6 flex items-center justify-center gap-2 rounded-full border border-white/[.16] py-2.5 text-[13.5px] font-semibold text-[#dfe6e0] transition-colors hover:bg-white/5">
            <Smartphone className="h-4 w-4" strokeWidth={2} />
            Descarcă aplicația Android v{ANDROID_APP_VERSION}
          </a>
        </div>
      </div>
    </div>
  );
}

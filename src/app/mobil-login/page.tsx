import "../mobil/mobile.css";
import { Logo } from "@/components/logo";
import { MobileLoginForm } from "./login-form";
import { ANDROID_APP_VERSION } from "@/lib/android-release";
import { CONTACT_PHONE_DISPLAY, CONTACT_WHATSAPP_URL } from "@/lib/contact";

export const metadata = { title: "Conectare | ElectroField", robots: { index: false } };

export default function MobileLoginPage() {
  return (
    <div className="ef-app-theme m-root mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 pb-8 pt-[max(28px,env(safe-area-inset-top))]">
      <div className="pt-4">
        <Logo size={34} />
      </div>

      <div className="mt-14">
        <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-tight">
          Bine ai venit,
          <br />
          tehnician.
        </h1>
        <p className="mt-3 text-[15px] text-[var(--m-mu)]">Conectează-te cu contul primit de la firma ta.</p>
      </div>

      <MobileLoginForm />

      <div className="mt-auto pt-10 text-center text-[12.5px] leading-relaxed text-[var(--m-mu)]">
        Contul îl creează firma ta. Dacă nu-l ai sau ai uitat parola, cere-l administratorului sau scrie-ne pe{" "}
        <a href={CONTACT_WHATSAPP_URL} className="font-bold text-[var(--m-ink)] underline" target="_blank" rel="noopener noreferrer">
          WhatsApp {CONTACT_PHONE_DISPLAY}
        </a>
        .
        <div className="mt-3">ElectroField v{ANDROID_APP_VERSION} · Datele tale sunt în Uniunea Europeană</div>
      </div>
    </div>
  );
}

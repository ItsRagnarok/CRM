import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, ShieldOff } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { grantLocationConsent, revokeLocationConsent } from "./actions";

export default async function MobileConsentPage() {
  const { profile, organization } = await requireSessionContext();
  const hasConsent = Boolean(profile.location_consent_at);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil/profil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Confidențialitate & locație</div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className={`rounded-[13px] border p-4 ${hasConsent ? "border-success-bg bg-success-bg" : "border-[#eaecf0] bg-white"}`}>
          <div className="flex items-center gap-2.5">
            {hasConsent ? (
              <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <ShieldOff className="h-5 w-5 shrink-0 text-muted-2" />
            )}
            <div className="text-[14px] font-bold">
              {hasConsent ? "Ai acordat consimțământul pentru urmărire GPS" : "Nu ai acordat consimțământul pentru urmărire GPS"}
            </div>
          </div>
          {hasConsent && profile.location_consent_at && (
            <div className="mt-1 pl-[30px] text-[11.5px] text-muted-2">
              Acordat pe {new Date(profile.location_consent_at).toLocaleString("ro-RO")}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[13.5px] font-bold text-foreground">
            <MapPin className="h-4 w-4 text-electric" /> Ce înseamnă asta
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-2">
            Dacă {organization.name} are activată urmărirea GPS continuă, aplicația poate trimite poziția ta către
            dispecerat cât timp ai aplicația deschisă și ești în programul de lucru — pentru a te afișa pe harta
            echipei și a confirma automat sosirea la o lucrare. Nu se întâmplă nimic în afara orelor de lucru sau
            dacă închizi aplicația. Poziția e ștearsă automat după {organization.gps_retention_days} zile.
          </p>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-2">
            Poți retrage consimțământul oricând, fără nicio consecință asupra angajării tale — urmărirea se oprește
            imediat. Detalii complete în{" "}
            <Link href="/confidentialitate" target="_blank" className="font-semibold text-electric">
              Politica de confidențialitate
            </Link>
            .
          </p>
        </div>

        <div className="mt-4">
          {hasConsent ? (
            <form action={revokeLocationConsent}>
              <button
                type="submit"
                className="w-full rounded-[12px] border border-danger-bg bg-white py-3.5 text-[13.5px] font-bold text-danger"
              >
                Retrage consimțământul
              </button>
            </form>
          ) : (
            <form action={grantLocationConsent}>
              <button
                type="submit"
                className="w-full rounded-[12px] bg-electric py-3.5 text-[13.5px] font-bold text-white shadow-[0_4px_10px_rgba(47,111,237,0.28)]"
              >
                Sunt de acord cu urmărirea GPS
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

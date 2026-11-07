import { cookies } from "next/headers";
import { Bell, CalendarOff, LifeBuoy, MapPin, Smartphone } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { ScreenHeader, MenuRow } from "@/components/mobile/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION } from "@/lib/app-version";
import { ANDROID_APP_VERSION } from "@/lib/android-release";
import { createClient } from "@/lib/supabase/server";
import { SignOutForm } from "../profil/sign-out-form";
import { NotificationsToggle } from "../profil/notifications-toggle";
import { DisplayToggles } from "./display-toggles";

export default async function MobileSettingsPage() {
  const { profile } = await requireSessionContext();
  const store = await cookies();
  const supabase = await createClient();
  const { data: active } = await supabase
    .from("job_assignments")
    .select("jobs!inner(status)")
    .eq("profile_id", profile.id)
    .in("jobs.status", ["in_drum", "ajunsa", "in_lucru", "pauza"])
    .limit(1);
  const hasActiveJob = (active ?? []).length > 0;

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Setări" back="/mobil/meniu" />
      <div className="m-bd" style={{ overflow: "visible" }}>
        <div className="m-lb">Notificări</div>
        <div className="m-list">
          <NotificationsToggle initialEnabled={profile.notifications_enabled} />
          <MenuRow href="/mobil/profil/notificari" icon={Bell} title="Ce notificări primesc" description="Mesaje, apeluri, lucrări, aprobări" />
        </div>

        <div className="m-lb" style={{ marginTop: 6 }}>Aspect</div>
        <div className="m-cd m-r">
          <div className="m-fl" style={{ fontSize: 15.5, fontWeight: 700 }}>Temă</div>
          <ThemeToggle />
        </div>
        <DisplayToggles sun={store.get("ef_sun")?.value === "1"} gloves={store.get("ef_gloves")?.value === "1"} />

        <div className="m-lb" style={{ marginTop: 6 }}>Locație și date</div>
        <div className="m-list">
          <MenuRow
            href="/mobil/confidentialitate"
            icon={MapPin}
            title="Locație și confidențialitate"
            description={profile.location_consent_at ? "Consimțământ acordat" : "Consimțământ neacordat"}
          />
          <MenuRow href="/mobil/concediu" icon={CalendarOff} title="Concediu și absențe" tone="g" />
        </div>

        <div className="m-lb" style={{ marginTop: 6 }}>Suport</div>
        <div className="m-list">
          <MenuRow href="/mobil/ajutor" icon={LifeBuoy} title="Ajutor și suport" tone="g" />
        </div>

        <div className="m-cd m-r">
          <span className="m-ic sm"><Smartphone className="m-i" /></span>
          <div className="m-fl">
            <div style={{ fontSize: 15, fontWeight: 700 }}>Versiune</div>
            <div className="m-mu m-sm">ElectroField v{APP_VERSION} · aplicația Android {ANDROID_APP_VERSION}</div>
          </div>
        </div>

        {hasActiveJob ? (
          <div className="m-note warn m-sm">
            Nu te poți deconecta cât ai o lucrare activă (în drum, la locație sau în lucru). Finalizează lucrarea sau sună la birou.
          </div>
        ) : (
          <SignOutForm />
        )}
      </div>
    </div>
  );
}

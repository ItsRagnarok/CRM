import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PREF_LABELS, prefEnabled, type PrefKey } from "@/lib/notify";
import { NotificationsToggle } from "../notifications-toggle";
import { Preferences, TestPushButton, type PrefRow } from "./preferences";

export default async function NotificationPreferencesPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: devices } = await supabase
    .from("device_push_tokens")
    .select("updated_at")
    .eq("profile_id", profile.id)
    .order("updated_at", { ascending: false });
  const lastSeen = devices?.[0]?.updated_at;

  const rows: PrefRow[] = (Object.keys(PREF_LABELS) as PrefKey[]).map((key) => ({
    key,
    ...PREF_LABELS[key],
    enabled: prefEnabled(profile.notification_prefs, key),
  }));

  return (
    <div className="flex flex-col pb-6">
      <div className="flex items-center gap-1 border-b border-[#eaecf0] bg-white px-4 pb-3 pt-2">
        <Link href="/mobil/setari" aria-label="Înapoi" className="-ml-2 flex h-11 w-11 items-center justify-center text-[#344054]">
          <ChevronLeft className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="flex-1 text-[18px] font-extrabold">Notificări</h1>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-[14px] border border-[#eaecf0] bg-white p-3.5 text-[12.5px] leading-snug">
          <div className="text-[13.5px] font-bold">
            {devices && devices.length > 0
              ? `${devices.length} ${devices.length === 1 ? "telefon înregistrat" : "telefoane înregistrate"} pentru notificări`
              : "Niciun telefon înregistrat pentru notificări"}
          </div>
          <div className="mt-1 text-muted">
            {devices && devices.length > 0
              ? `Le primești și când aplicația e închisă. Ultima înregistrare: ${new Date(lastSeen!).toLocaleString("ro-RO", {
                  timeZone: "Europe/Bucharest",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}.`
              : "Notificările pe telefon funcționează în aplicația Android, după ce permiți notificările. Într-un browser vezi doar clopoțelul."}
          </div>
        </div>

        <TestPushButton />

        <div className="mt-1 text-[12px] font-bold uppercase tracking-wide text-muted-2">Ce vrei să primești</div>
        <div className="overflow-hidden rounded-[14px] border border-[#eaecf0] bg-white">
          <NotificationsToggle initialEnabled={profile.notifications_enabled} />
        </div>
        <Preferences rows={rows} />
        <p className="text-[11.5px] text-muted-2">
          Preferințele se aplică notificărilor pe telefon. Clopoțelul din aplicație păstrează întotdeauna tot istoricul.
        </p>
      </div>
    </div>
  );
}

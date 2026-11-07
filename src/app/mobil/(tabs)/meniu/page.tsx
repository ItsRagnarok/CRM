import { Package, Wallet, Clock, FileText, CalendarOff, Settings, LifeBuoy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { MenuRow } from "@/components/mobile/ui";
import { APP_VERSION } from "@/lib/app-version";

export default async function MobileMenuPage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("team_members").select("teams(name)").eq("profile_id", profile.id).maybeSingle();
  const color = avatarColor(profile.id);

  return (
    <div className="flex flex-col">
        <header className="m-hd"><h1 className="m-t1 m-fl">Meniu</h1></header>
        <div className="m-bd" style={{ overflow: "visible" }}>
          <Link href="/mobil/profil" className="m-cd m-r" style={{ gap: 14, padding: "14px 16px" }}>
            <div className="m-av" style={{ width: 54, height: 54, background: color.bg, color: color.text, fontSize: 17 }}>{initials(profile.full_name)}</div>
            <div className="m-fl">
              <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.full_name}</div>
              <div className="m-mu m-sm">{ROLE_LABELS[profile.role]} · {organization.name}{membership?.teams?.name ? ` · ${membership.teams.name}` : ""}</div>
            </div>
            <ChevronRight className="m-chev" />
          </Link>

          <div className="m-list">
            <MenuRow href="/mobil/materiale" icon={Package} title="Materiale și mașină" />
            <MenuRow href="/mobil/cheltuieli" icon={Wallet} title="Cheltuieli" />
            <MenuRow href="/mobil/pontaj" icon={Clock} title="Pontaj" />
            <MenuRow href="/mobil/documente" icon={FileText} title="Documente și autorizații" />
          </div>
          <div className="m-list">
            <MenuRow href="/mobil/concediu" icon={CalendarOff} title="Concediu și absențe" tone="g" />
            <MenuRow href="/mobil/setari" icon={Settings} title="Setări" tone="g" />
            <MenuRow href="/mobil/ajutor" icon={LifeBuoy} title="Ajutor și suport" tone="g" />
          </div>
          <div className="m-mu" style={{ textAlign: "center", fontSize: 12 }}>ElectroField v{APP_VERSION}</div>
        </div>
    </div>
  );
}

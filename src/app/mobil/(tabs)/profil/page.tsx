import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { ScreenHeader } from "@/components/mobile/ui";
import { addDays, formatHM, dailyWorkedHours, startOfWeek, toISODate } from "@/app/(app)/pontaj/lib";
import { startOfOrgDay, todayInOrgTimeZone } from "@/lib/date";

export default async function MobileProfilePage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = toISODate(startOfWeek(new Date(`${today}T00:00:00Z`)));

  const [{ data: entries }, { data: assignments }, { data: membership }] = await Promise.all([
    supabase.from("time_entries").select("event_type, occurred_at").eq("profile_id", profile.id).gte("occurred_at", startOfOrgDay(monthStart)),
    supabase.from("job_assignments").select("jobs(scheduled_date, status)").eq("profile_id", profile.id),
    supabase.from("team_members").select("teams(name)").eq("profile_id", profile.id).maybeSingle(),
  ]);

  const hours = [...dailyWorkedHours((entries ?? []).map((e) => ({ ...e, profile_id: profile.id, job_id: "" })), "work_start", "work_end").values()].reduce((s, h) => s + h, 0);
  const jobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const doneThisMonth = jobs.filter((j) => j.status === "finalizata" && j.scheduled_date >= monthStart).length;
  const thisWeek = jobs.filter((j) => j.scheduled_date >= weekStart && j.scheduled_date <= toISODate(addDays(new Date(`${weekStart}T00:00:00Z`), 6))).length;
  const color = avatarColor(profile.id);

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Profil" back="/mobil/meniu" />
      <div className="m-bd" style={{ overflow: "visible" }}>
        <div className="m-cd" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px" }}>
          <div className="m-av" style={{ width: 72, height: 72, fontSize: 24, background: color.bg, color: color.text }}>{initials(profile.full_name)}</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{profile.full_name}</div>
            <div className="m-mu m-sm">{ROLE_LABELS[profile.role]} · {organization.name}</div>
          </div>
          <div className="m-r" style={{ width: "100%", marginTop: 6 }}>
            <div className="m-stat"><b>{doneThisMonth}</b><span>lucrări finalizate luna asta</span></div>
            <div style={{ width: 1, height: 34, background: "var(--m-ln)" }} />
            <div className="m-stat"><b>{thisWeek}</b><span>lucrări săptămâna asta</span></div>
            <div style={{ width: 1, height: 34, background: "var(--m-ln)" }} />
            <div className="m-stat"><b style={{ fontSize: 18 }}>{formatHM(hours)}</b><span>ore luna asta</span></div>
          </div>
        </div>

        <div className="m-list">
          <div className="m-row"><span className="m-mu m-fl" style={{ maxWidth: 90, fontSize: 13 }}>Echipă</span><span className="m-fl" style={{ fontWeight: 700, fontSize: 15 }}>{membership?.teams?.name ?? "—"}</span></div>
          <hr className="m-sep" />
          <div className="m-row"><span className="m-mu m-fl" style={{ maxWidth: 90, fontSize: 13 }}>Compania</span><span className="m-fl" style={{ fontWeight: 700, fontSize: 15 }}>{organization.name}</span></div>
          {organization.phone && (
            <>
              <hr className="m-sep" />
              <div className="m-row"><span className="m-mu m-fl" style={{ maxWidth: 90, fontSize: 13 }}>Birou</span><a href={`tel:${organization.phone}`} className="m-fl" style={{ fontWeight: 700, fontSize: 15, color: "var(--m-aci)" }}>{organization.phone}</a></div>
            </>
          )}
          <hr className="m-sep" />
        </div>
        <p className="m-mu m-sm" style={{ textAlign: "center" }}>
          Datele de contact și rolul se schimbă din platformă, de către administrator.
        </p>
      </div>
    </div>
  );
}

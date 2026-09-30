import Link from "next/link";
import { LogOut, Shield, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { pairHours, formatHM } from "@/app/(app)/pontaj/lib";
import { signOut } from "@/app/(app)/actions";
import { NotificationsToggle } from "./notifications-toggle";
import { todayInOrgTimeZone } from "@/lib/date";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfWeek(d: Date) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + diff);
  return c;
}

export default async function MobileProfilePage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();

  const todayStr = todayInOrgTimeZone();
  const now = new Date(`${todayStr}T00:00:00Z`);
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;
  const weekStartStr = toISODate(startOfWeek(now));

  const [{ data: entriesThisMonth }, { data: assignments }, { count: documentCount }, { data: membership }] =
    await Promise.all([
      supabase
        .from("time_entries")
        .select("event_type, occurred_at")
        .eq("profile_id", profile.id)
        .gte("occurred_at", `${monthStartStr}T00:00:00`),
      supabase
        .from("job_assignments")
        .select("jobs(scheduled_date, status)")
        .eq("profile_id", profile.id),
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
      supabase.from("team_members").select("teams(name)").eq("profile_id", profile.id).maybeSingle(),
    ]);

  const hoursThisMonth = pairHours(
    (entriesThisMonth ?? []).map((e) => ({ ...e, profile_id: profile.id, job_id: "" })),
    "work_start",
    "work_end"
  );

  const jobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const jobsThisWeek = jobs.filter((j) => j.scheduled_date >= weekStartStr).length;
  const jobsCompleted = jobs.filter((j) => j.status === "finalizata").length;
  const isActiveNow = jobs.some((j) => j.status === "in_lucru" || j.status === "pauza");
  const ACTIVE_JOB_STATUSES = ["in_drum", "ajunsa", "in_lucru", "pauza"];
  const hasActiveJob = jobs.some((j) => ACTIVE_JOB_STATUSES.includes(j.status));

  const color = avatarColor(profile.id);

  return (
    <div className="flex flex-col px-5 pb-4 pt-3">
      <div className="flex flex-col items-center py-3">
        <div
          className="flex h-[76px] w-[76px] items-center justify-center rounded-full text-[26px] font-extrabold"
          style={{ background: color.bg, color: color.text }}
        >
          {initials(profile.full_name)}
        </div>
        <div className="mt-3 text-[18px] font-extrabold">{profile.full_name}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-2">
          {ROLE_LABELS[profile.role]} · {organization.name}
        </div>
        {membership?.teams?.name && (
          <div className="mt-1 rounded-full bg-electric-soft px-3 py-1 text-[11px] font-bold text-electric">
            {membership.teams.name}
          </div>
        )}
        {isActiveNow && (
          <div className="mt-2 rounded-full bg-success-bg px-3 py-1 text-[11px] font-bold text-success">
            ● Activ acum
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatBox value={formatHM(hoursThisMonth)} label="ORE LUNA ASTA" />
        <StatBox value={String(jobsThisWeek)} label="LUCRĂRI SĂPT." />
        <StatBox value={String(jobsCompleted)} label="FINALIZATE" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[13px] border border-[#eaecf0] bg-white">
        <Link href="/mobil/confidentialitate" className="flex items-center gap-3 border-b border-[#f2f4f7] px-4 py-3.5">
          <Shield className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
          <div className="flex-1 text-[13.5px] font-semibold">Confidențialitate & locație</div>
          <div className="text-[11.5px] font-semibold text-muted-2">
            {profile.location_consent_at ? "Consimțământ acordat" : "Consimțământ neacordat"}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-2" />
        </Link>
        <NotificationsToggle initialEnabled={profile.notifications_enabled} />
        <Link href="/mobil/documente" className="flex items-center gap-3 border-b border-[#f2f4f7] px-4 py-3.5">
          <FileText className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
          <div className="flex-1 text-[13.5px] font-semibold">Documentele mele</div>
          <div className="text-[11.5px] font-semibold text-muted-2">{documentCount ?? 0}</div>
          <ChevronRight className="h-4 w-4 text-muted-2" />
        </Link>
        <Link href="/mobil/ajutor" className="flex items-center gap-3 px-4 py-3.5">
          <HelpCircle className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
          <div className="flex-1 text-[13.5px] font-semibold">Ajutor & suport</div>
          <ChevronRight className="h-4 w-4 text-muted-2" />
        </Link>
      </div>

      {hasActiveJob ? (
        <div className="mt-4 rounded-[12px] border border-[#eaecf0] bg-neutral-bg p-3.5 text-center text-[12.5px] text-muted-2">
          Nu te poți deconecta cât ai o lucrare activă (în drum, la locație sau în lucru). Finalizează sau
          contactează administratorul dacă e nevoie să ieși din aplicație.
        </div>
      ) : (
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-danger-bg bg-white py-3.5 text-[13.5px] font-bold text-danger"
          >
            <LogOut className="h-4 w-4" /> Deconectare
          </button>
        </form>
      )}
      <div className="mt-3.5 text-center text-[11px] text-muted-2">ElectroField · v1.0.0</div>
    </div>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-[#eaecf0] bg-white px-2 py-3.5 text-center">
      <div className="text-[16px] font-extrabold">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold text-muted-2">{label}</div>
    </div>
  );
}

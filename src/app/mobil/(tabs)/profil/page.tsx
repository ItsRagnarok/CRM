import { LogOut, Shield, HelpCircle } from "lucide-react";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { pairHours, formatHM } from "@/app/(app)/pontaj/lib";
import { signOut } from "@/app/(app)/actions";

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

  const now = new Date();
  const monthStartStr = `${toISODate(now).slice(0, 7)}-01`;
  const weekStartStr = toISODate(startOfWeek(now));

  const [{ data: entriesThisMonth }, { data: assignments }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("event_type, occurred_at")
      .eq("profile_id", profile.id)
      .gte("occurred_at", `${monthStartStr}T00:00:00`),
    supabase
      .from("job_assignments")
      .select("jobs(scheduled_date, status)")
      .eq("profile_id", profile.id),
  ]);

  const hoursThisMonth = pairHours(
    (entriesThisMonth ?? []).map((e) => ({ ...e, profile_id: profile.id, job_id: "" })),
    "work_start",
    "work_end"
  );

  const jobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const jobsThisWeek = jobs.filter((j) => j.scheduled_date >= weekStartStr).length;
  const jobsCompleted = jobs.filter((j) => j.status === "finalizata").length;

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
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatBox value={formatHM(hoursThisMonth)} label="ORE LUNA ASTA" />
        <StatBox value={String(jobsThisWeek)} label="LUCRĂRI SĂPT." />
        <StatBox value={String(jobsCompleted)} label="FINALIZATE" />
      </div>

      <div className="mt-5 overflow-hidden rounded-[13px] border border-[#eaecf0] bg-white">
        <MenuRow icon={Shield} label="Confidențialitate & locație" />
        <MenuRow icon={HelpCircle} label="Ajutor & suport" last />
      </div>

      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-danger-bg bg-white py-3.5 text-[13.5px] font-bold text-danger"
        >
          <LogOut className="h-4 w-4" /> Deconectare
        </button>
      </form>
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

function MenuRow({
  icon: Icon,
  label,
  last,
}: {
  icon: typeof Shield;
  label: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? "" : "border-b border-[#f2f4f7]"}`}>
      <Icon className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
      <div className="flex-1 text-[13.5px] font-semibold">{label}</div>
    </div>
  );
}

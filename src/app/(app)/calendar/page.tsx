import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarGrid } from "./calendar-grid";
import { TeamWeek } from "./team-week";
import type { WeekJob } from "@/lib/team-week";
import { todayInOrgTimeZone } from "@/lib/date";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(s: string) {
  return new Date(`${s}T00:00:00Z`);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function startOfWeek(d: Date) {
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  return addDays(d, diff);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; teamId?: string }>;
}) {
  const { date, view: viewParam, teamId = "" } = await searchParams;
  const view: "day" | "week" | "echipe" = viewParam === "day" ? "day" : viewParam === "week" ? "week" : "echipe";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const todayStr = todayInOrgTimeZone();
  const anchor = date ? parseISODate(date) : parseISODate(todayStr);
  const rangeStart = view === "day" ? anchor : startOfWeek(anchor);
  const rangeEnd = view === "day" ? anchor : addDays(rangeStart, 6);
  const stepWeek = view !== "day";
  const rangeStartStr = toISODate(rangeStart);
  const rangeEndStr = toISODate(rangeEnd);
  const stepDays = stepWeek ? 7 : 1;
  const prevStr = toISODate(addDays(anchor, -stepDays));
  const nextStr = toISODate(addDays(anchor, stepDays));

  if (view === "echipe") {
    const [{ data: teamRows }, { data: jobRows }, { data: leaveRows }] = await Promise.all([
      supabase.from("teams").select("id, name, team_members(profile_id, profiles(full_name))").eq("organization_id", organization.id).eq("is_active", true).order("name"),
      supabase
        .from("jobs")
        .select("id, display_number, title, status, domain, scheduled_date, start_time, end_time, team_id, clients(name), job_assignments(profile_id, profiles(full_name))")
        .eq("organization_id", organization.id)
        .gte("scheduled_date", rangeStartStr)
        .lte("scheduled_date", rangeEndStr),
      supabase.from("time_off_requests").select("profile_id, start_date, end_date, profiles!time_off_requests_profile_id_fkey(full_name)").eq("organization_id", organization.id).eq("status", "approved").lte("start_date", rangeEndStr).gte("end_date", rangeStartStr),
    ]);
    const teamOfPerson = new Map<string, string>();
    const teams = (teamRows ?? []).map((t) => {
      for (const m of t.team_members) teamOfPerson.set(m.profile_id, t.id);
      return { id: t.id, name: t.name, members: t.team_members.map((m) => m.profiles?.full_name?.split(" ")[0] ?? "").filter(Boolean) };
    });
    const weekJobs: WeekJob[] = (jobRows ?? []).map((j) => ({
      id: j.id, display_number: j.display_number, title: j.title, status: j.status, domain: j.domain, scheduled_date: j.scheduled_date,
      start_time: j.start_time, end_time: j.end_time, team_id: j.team_id, clients: j.clients,
      assignees: j.job_assignments.map((a) => ({ id: a.profile_id, name: a.profiles?.full_name ?? "" })),
    }));
    const leaves = (leaveRows ?? []).map((l) => ({ name: l.profiles?.full_name ?? "", teamId: teamOfPerson.get(l.profile_id) ?? null, start: l.start_date, end: l.end_date }));
    const withWeekend = weekJobs.some((j) => ["5", "6"].includes(String((new Date(`${j.scheduled_date}T00:00:00Z`).getUTCDay() + 6) % 7)));
    const dayList = Array.from({ length: withWeekend ? 7 : 5 }, (_, i) => ({ dateStr: toISODate(addDays(rangeStart, i)) }));
    const members = new Set(teamOfPerson.keys()).size;
    const hoursAvailable = members * (organization.standard_hours_per_day ?? 8) * 5;
    const fmt = (d: Date) => d.toLocaleDateString("ro-RO", { timeZone: "UTC", day: "numeric", month: "long" });
    const tab = (id: string, label: string) => (
      <Link key={id} href={`/calendar?view=${id}&date=${toISODate(anchor)}`} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${id === "echipe" ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>{label}</Link>
    );
    return (
      <div className="flex flex-col gap-4 p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-extrabold text-foreground">Calendar și echipe · {fmt(rangeStart)} – {fmt(addDays(rangeStart, dayList.length - 1))}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {tab("echipe", "Echipe")}{tab("week", "Ore pe săptămână")}{tab("day", "Zi")}
            <Link href={`/calendar?date=${prevStr}`} className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-bold" aria-label="Săptămâna anterioară">‹</Link>
            <Link href="/calendar" className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-bold">Azi</Link>
            <Link href={`/calendar?date=${nextStr}`} className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-bold" aria-label="Săptămâna următoare">›</Link>
            <Link href="/echipe" className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-bold">Gestionează echipele</Link>
            <Link href="/lucrari/nou" className="rounded-[10px] bg-electric px-4 py-2 text-[13px] font-bold">Programează lucrare</Link>
          </div>
        </div>
        <TeamWeek days={dayList} teams={teams} jobs={weekJobs} leaves={leaves} todayStr={todayStr} hoursAvailable={hoursAvailable} />
      </div>
    );
  }

  const [{ data: teams }, { data: jobs }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name"),
    (() => {
      let query = supabase
        .from("jobs")
        .select(
          "id, display_number, title, status, scheduled_date, start_time, end_time, team_id, clients(name), job_assignments(profiles(full_name))"
        )
        .eq("organization_id", organization.id)
        .gte("scheduled_date", rangeStartStr)
        .lte("scheduled_date", rangeEndStr);
      if (teamId) query = query.eq("team_id", teamId);
      return query;
    })(),
  ]);

  const days: { dateStr: string; dayNum: number; isToday: boolean }[] = [];
  for (let i = 0; i < (view === "day" ? 1 : 7); i++) {
    const d = addDays(rangeStart, i);
    const dStr = toISODate(d);
    days.push({ dateStr: dStr, dayNum: d.getUTCDate(), isToday: dStr === todayStr });
  }

  return (
    <CalendarGrid
      view={view === "day" ? "day" : "week"}
      days={days}
      jobs={jobs ?? []}
      teams={teams ?? []}
      selectedTeamId={teamId}
      anchorStr={toISODate(anchor)}
      prevStr={prevStr}
      nextStr={nextStr}
      todayStr={todayStr}
    />
  );
}

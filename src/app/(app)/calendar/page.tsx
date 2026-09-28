import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarGrid } from "./calendar-grid";

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
  const view = viewParam === "day" ? "day" : "week";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const todayStr = toISODate(new Date());
  const anchor = date ? parseISODate(date) : parseISODate(todayStr);
  const rangeStart = view === "day" ? anchor : startOfWeek(anchor);
  const rangeEnd = view === "day" ? anchor : addDays(rangeStart, 6);
  const rangeStartStr = toISODate(rangeStart);
  const rangeEndStr = toISODate(rangeEnd);
  const stepDays = view === "day" ? 1 : 7;
  const prevStr = toISODate(addDays(anchor, -stepDays));
  const nextStr = toISODate(addDays(anchor, stepDays));

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
      view={view}
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

import { CalendarDays, Clock3, Layers, Plane, Users, Info } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { domainLabel } from "@/lib/domains";
import { findConflicts, jobHours, type WeekJob } from "@/lib/team-week";
import { CalendarToolbar } from "./calendar-toolbar";
import { VIEW_HINTS, type CalQuery, type CalView } from "./cal-query";
import { CalendarGrid, type GridColumn } from "./calendar-grid";
import { DayHead, TeamWeek, type CalLeave, type CalTeam } from "./team-week";

const MONTH = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const WEEKDAY = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
function startOfWeek(d: Date) {
  const day = d.getUTCDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}
const dm = (s: string) => { const d = parse(s); return `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`; };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; teamId?: string; domain?: string }>;
}) {
  const sp = await searchParams;
  const view: CalView = sp.view === "day" ? "day" : sp.view === "week" ? "week" : "echipe";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const todayStr = todayInOrgTimeZone();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayStr;
  const q: CalQuery = { view, date, teamId: sp.teamId ?? "", domain: sp.domain ?? "" };
  const anchor = parse(date);
  // Cifrele de sus și suprapunerile se calculează mereu pe toată săptămâna, în orice vedere.
  const weekStart = startOfWeek(anchor);
  const weekStartStr = iso(weekStart);
  const weekEndStr = iso(addDays(weekStart, 6));

  const [{ data: teamRows }, { data: jobRows }, { data: leaveRows }] = await Promise.all([
    supabase.from("teams").select("id, name, description, team_members(profile_id, profiles(full_name))").eq("organization_id", organization.id).eq("is_active", true).order("name"),
    supabase
      .from("jobs")
      .select("id, display_number, title, status, domain, scheduled_date, start_time, end_time, team_id, clients(name), job_assignments(profile_id, profiles(full_name))")
      .eq("organization_id", organization.id)
      .gte("scheduled_date", weekStartStr)
      .lte("scheduled_date", weekEndStr),
    supabase.from("time_off_requests").select("profile_id, start_date, end_date, profiles!time_off_requests_profile_id_fkey(full_name)").eq("organization_id", organization.id).eq("status", "approved").lte("start_date", weekEndStr).gte("end_date", weekStartStr),
  ]);

  const teamOfPerson = new Map<string, string>();
  const allTeams: CalTeam[] = (teamRows ?? []).map((t) => {
    for (const m of t.team_members) teamOfPerson.set(m.profile_id, t.id);
    return { id: t.id, name: t.name, description: t.description, members: t.team_members.map((m) => m.profiles?.full_name?.split(" ")[0] ?? "").filter(Boolean) };
  });
  const allJobs: WeekJob[] = (jobRows ?? [])
    .filter((j) => j.status !== "anulata")
    .map((j) => ({
      id: j.id, display_number: j.display_number, title: j.title, status: j.status, domain: j.domain, scheduled_date: j.scheduled_date,
      start_time: j.start_time, end_time: j.end_time, team_id: j.team_id, clients: j.clients,
      assignees: j.job_assignments.map((a) => ({ id: a.profile_id, name: a.profiles?.full_name ?? "" })),
    }));
  const allLeaves: CalLeave[] = (leaveRows ?? []).map((l) => ({ name: l.profiles?.full_name ?? "", teamId: teamOfPerson.get(l.profile_id) ?? null, start: l.start_date, end: l.end_date }));

  // Suprapunerile se caută pe toate lucrările (un tehnician poate fi în două echipe/domenii), apoi se filtrează afișarea.
  const conflicts = findConflicts(allJobs);
  const teams = q.teamId ? allTeams.filter((t) => t.id === q.teamId) : allTeams;
  const jobs = allJobs.filter((j) => (!q.teamId || j.team_id === q.teamId) && (!q.domain || j.domain === q.domain));
  const leaves = q.teamId ? allLeaves.filter((l) => l.teamId === q.teamId) : allLeaves;

  // Weekendul apare doar dacă are lucrări.
  const withWeekend = allJobs.some((j) => { const w = parse(j.scheduled_date).getUTCDay(); return w === 0 || w === 6; });
  const weekDays = Array.from({ length: withWeekend ? 7 : 5 }, (_, i) => iso(addDays(weekStart, i)));

  // KPI-uri
  const tomorrow = iso(addDays(parse(todayStr), 1));
  const busyTomorrow = new Set(allJobs.filter((j) => j.scheduled_date === tomorrow).map((j) => j.team_id));
  const freeTeams = allTeams.filter((t) => !busyTomorrow.has(t.id)).length;
  // Câți tehnicieni distincți au cel puțin o suprapunere în săptămână (un om alocat în două locuri deodată).
  const conflictPeople = (() => {
    const byKey = new Map<string, number>();
    for (const j of allJobs) if (conflicts.has(j.id)) for (const a of j.assignees) { const k = `${a.id}|${j.scheduled_date}`; byKey.set(k, (byKey.get(k) ?? 0) + 1); }
    return new Set([...byKey].filter(([, n]) => n > 1).map(([k]) => k.split("|")[0])).size;
  })();
  const hours = jobs.reduce((a, j) => a + jobHours(j), 0);
  const people = q.teamId ? (allTeams.find((t) => t.id === q.teamId)?.members.length ?? 0) : teamOfPerson.size;
  const hoursAvailable = people * (organization.standard_hours_per_day ?? 8) * 5;

  const stepDays = view === "day" ? 1 : 7;
  const prevDate = iso(addDays(anchor, -stepDays));
  const nextDate = iso(addDays(anchor, stepDays));
  const showsToday = view === "day" ? date === todayStr : todayStr >= weekStartStr && todayStr <= weekEndStr;
  const rangeLabel = view === "day"
    ? `${WEEKDAY[anchor.getUTCDay()]}, ${dm(date)}`
    : `${dm(weekDays[0])} – ${dm(weekDays[weekDays.length - 1])}`;

  const domains = (organization.enabled_domains ?? []).map((id) => ({ id, label: domainLabel(id) }));

  let body: React.ReactNode;
  if (view === "echipe") {
    body = <TeamWeek days={weekDays} teams={teams} jobs={jobs} conflicts={conflicts} leaves={leaves} todayStr={todayStr} />;
  } else if (view === "week") {
    const columns: GridColumn[] = weekDays.map((d) => ({
      key: d,
      dateStr: d,
      head: <DayHead dateStr={d} todayStr={todayStr} />,
      jobs: jobs.filter((j) => j.scheduled_date === d),
      leaves: leaves.filter((l) => l.start <= d && l.end >= d).map((l) => l.name),
    }));
    body = <CalendarGrid columns={columns} conflicts={[...conflicts]} draggable firstHead="Ora" />;
  } else {
    const dayJobs = jobs.filter((j) => j.scheduled_date === date);
    const loose = dayJobs.filter((j) => !j.team_id);
    const cols: CalTeam[] = [...teams, ...(loose.length ? [{ id: "", name: "Fără echipă", description: null, members: [] }] : [])];
    const columns: GridColumn[] = cols.map((t) => ({
      key: t.id || "none",
      dateStr: date,
      head: (
        <div className="px-3 py-3">
          <div className="truncate text-[13.5px] font-extrabold text-foreground">{t.name}</div>
          <div className="truncate text-[11.5px] text-muted">{t.description ?? (t.members.join(", ") || " ")}</div>
        </div>
      ),
      jobs: dayJobs.filter((j) => (j.team_id ?? "") === t.id),
      leaves: leaves.filter((l) => (l.teamId ?? "") === t.id && l.start <= date && l.end >= date).map((l) => l.name),
    }));
    body = columns.length
      ? <CalendarGrid columns={columns} conflicts={[...conflicts]} draggable={false} firstHead="Ora" />
      : <div className="rounded-2xl border border-border bg-white px-4 py-12 text-center text-sm text-muted">Nicio echipă activă.</div>;
  }

  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <div className="flex items-start gap-4">
        <div className="ef-cal-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
          <CalendarDays className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">Calendar și echipe</h1>
          <p className="mt-0.5 text-[14px] text-muted">Planifică, coordonează și urmărește lucrările echipelor din teren.</p>
        </div>
      </div>

      <CalendarToolbar
        q={q}
        rangeLabel={rangeLabel}
        prevDate={prevDate}
        nextDate={nextDate}
        todayStr={todayStr}
        showsToday={showsToday}
        teams={allTeams.map((t) => ({ id: t.id, name: t.name }))}
        domains={domains}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Echipe libere mâine" value={`${freeTeams} din ${allTeams.length}`} sub={freeTeams ? "fără nicio lucrare programată" : "toate au lucrări"} />
        <Kpi icon={Layers} label="Suprapuneri" value={conflictPeople} sub={conflictPeople ? "tehnicieni alocați de două ori în aceeași zi" : "nicio suprapunere"} alert={conflictPeople > 0} />
        <Kpi icon={Clock3} label="Ore planificate săptămâna asta" value={`${Math.round(hours)} h`} sub={hoursAvailable ? `din ${Math.round(hoursAvailable)} h disponibile` : "din ora de început și de sfârșit"} />
        <Kpi icon={Plane} label="Concedii în perioadă" value={leaves.length} sub={leaves.length ? leaves.slice(0, 2).map((l) => l.name).join(", ") : "niciun concediu aprobat"} />
      </div>

      <p className="-mb-1 text-[12.5px] text-muted">{VIEW_HINTS[view]}</p>
      {body}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-white px-5 py-3 text-[12.5px] text-[#475467]">
        <b className="text-foreground">Legendă:</b>
        {domains.map((d) => (
          <span key={d.id} className="inline-flex items-center gap-2"><span className={`ef-ev ef-ev-${d.id} h-4 w-4 rounded-[5px]`} /> {d.label}</span>
        ))}
        <span className="inline-flex items-center gap-2"><span className="ef-ev h-4 w-4 rounded-[5px]" /> Fără domeniu</span>
        <span className="inline-flex items-center gap-2"><span className="ef-ev ef-ev-conflict h-4 w-4 rounded-[5px]" /> Suprapunere (același tehnician alocat de două ori)</span>
        <span className="inline-flex items-center gap-2"><span className="ef-ev ef-ev-leave h-4 w-4 rounded-[5px]" /> Concediu</span>
        <span className="inline-flex items-center gap-1.5 text-muted"><Info className="h-3.5 w-3.5" /> Bulina din colțul cardului arată starea lucrării.</span>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, alert = false }: { icon: typeof Users; label: string; value: React.ReactNode; sub: string; alert?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_1px_3px_rgba(16,24,40,.04)]">
      <div className="flex items-start gap-3.5">
        <div className={`${alert ? "ef-cal-tile-red" : "ef-cal-tile"} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="relative z-10 min-w-0">
          <div className="text-[13.5px] font-semibold text-foreground">{label}</div>
          <div className="mt-1 text-[30px] font-extrabold leading-none tabular-nums text-foreground">{value}</div>
          <div className="mt-1.5 truncate text-[12.5px] text-muted">{sub}</div>
        </div>
      </div>
      {/* val decorativ în colț, ca în restul paginii */}
      <svg aria-hidden="true" className="pointer-events-none absolute -bottom-1 right-0 h-16 w-40" viewBox="0 0 160 64" preserveAspectRatio="none">
        <path d="M0 64 C 50 60, 100 40, 160 8 L 160 64 Z" fill={alert ? "#ef4444" : "#a3e635"} fillOpacity={alert ? 0.1 : 0.16} />
      </svg>
    </div>
  );
}

import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { DashboardMapLoader } from "@/components/dashboard-map-loader";
import { AutoRefresh } from "@/components/auto-refresh";
import type { DashboardMapMarker } from "@/components/dashboard-map";
import type { Database } from "@/lib/supabase/database.types";
import { todayInOrgTimeZone } from "@/lib/date";
import {
  Briefcase,
  UsersRound,
  Receipt,
  Clock,
  MapPin,
  Navigation,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Activity,
  TrendingUp,
} from "lucide-react";

const TEAM_MAP_COLORS = ["#15803d", "#1e293b", "#c2410c", "#7c3aed", "#0369a1"];
const ACTIVE_STATUSES: Database["public"]["Enums"]["job_status"][] = [
  "in_lucru",
  "in_drum",
  "ajunsa",
  "pauza",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}

function startOfDay(dateStr: string) {
  return `${dateStr}T00:00:00`;
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

type TimeEvent = { profile_id: string; job_id: string; event_type: string; occurred_at: string };

function hoursWorked(events: TimeEvent[]): number {
  const byKey = new Map<string, TimeEvent[]>();
  for (const e of events) {
    const key = `${e.profile_id}:${e.job_id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(e);
  }
  const now = Date.now();
  let totalMs = 0;
  for (const evs of byKey.values()) {
    evs.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    let openStart: number | null = null;
    for (const e of evs) {
      const t = new Date(e.occurred_at).getTime();
      if (e.event_type === "work_start") {
        openStart = t;
      } else if (e.event_type === "work_end" && openStart != null) {
        totalMs += t - openStart;
        openStart = null;
      }
    }
    if (openStart != null) totalMs += now - openStart;
  }
  return totalMs / 3_600_000;
}

function formatHours(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

type ActivityItem = {
  key: string;
  at: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconColor: string;
  text: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: "azi" | "7zile" = rawRange === "7zile" ? "7zile" : "azi";
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const firstName = profile.full_name.split(" ")[0];
  const today = todayInOrgTimeZone();

  // "azi" looks at just today; "7zile" looks back 7 days including today.
  // The trend comparison always uses the immediately preceding window of
  // the same length, so "↑ 12%" means the same thing in either mode.
  const rangeDays = range === "7zile" ? 7 : 1;
  const rangeStartDate = new Date(`${today}T00:00:00Z`);
  rangeStartDate.setUTCDate(rangeStartDate.getUTCDate() - (rangeDays - 1));
  const rangeStartStr = rangeStartDate.toISOString().slice(0, 10);
  const rangeEndStr = today;
  const rangeEndExclusiveDate = new Date(`${today}T00:00:00Z`);
  rangeEndExclusiveDate.setUTCDate(rangeEndExclusiveDate.getUTCDate() + 1);
  const rangeEndExclusiveStr = rangeEndExclusiveDate.toISOString().slice(0, 10);

  const prevStartDate = new Date(rangeStartDate);
  prevStartDate.setUTCDate(prevStartDate.getUTCDate() - rangeDays);
  const prevStartStr = prevStartDate.toISOString().slice(0, 10);
  const prevEndExclusiveStr = rangeStartStr;

  const [
    { data: jobsToday },
    { data: activeJobs },
    { data: expensesTodayRows },
    { data: expensesYesterdayRows },
    { data: timeEntriesToday },
    { data: timeEntriesYesterday },
    { count: activeTeamsCount },
    { data: historyToday },
    { data: arrivalsToday },
    { data: photosToday },
    { data: jobsCreatedToday },
    { data: livePositions },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, display_number, title, status, start_time, end_time, team_id, distance_km, clients(name), locations(address, lat, lng), job_assignments(profiles(full_name))"
      )
      .eq("organization_id", organization.id)
      .gte("scheduled_date", rangeStartStr)
      .lte("scheduled_date", rangeEndStr)
      .order("scheduled_date", { ascending: false })
      .order("start_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("jobs")
      .select(
        "id, display_number, title, status, team_id, clients(name), teams(name, team_members(profiles(full_name))), locations(lat, lng)"
      )
      .eq("organization_id", organization.id)
      .in("status", ACTIVE_STATUSES),
    supabase
      .from("expenses")
      .select("id, amount, vendor, created_at, jobs(display_number)")
      .eq("organization_id", organization.id)
      .gte("expense_date", rangeStartStr)
      .lte("expense_date", rangeEndStr),
    supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organization.id)
      .gte("expense_date", prevStartStr)
      .lt("expense_date", prevEndExclusiveStr),
    supabase
      .from("time_entries")
      .select("profile_id, job_id, event_type, occurred_at, profiles(hourly_rate)")
      .eq("organization_id", organization.id)
      .gte("occurred_at", startOfDay(rangeStartStr))
      .lt("occurred_at", startOfDay(rangeEndExclusiveStr)),
    supabase
      .from("time_entries")
      .select("profile_id, job_id, event_type, occurred_at, profiles(hourly_rate)")
      .eq("organization_id", organization.id)
      .gte("occurred_at", startOfDay(prevStartStr))
      .lt("occurred_at", startOfDay(prevEndExclusiveStr)),
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true),
    supabase
      .from("job_status_history")
      .select("id, status, created_at, profiles(full_name), jobs(display_number, title)")
      .gte("created_at", startOfDay(rangeStartStr))
      .lt("created_at", startOfDay(rangeEndExclusiveStr))
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("time_entries")
      .select("id, occurred_at, profiles(full_name), jobs(display_number, locations(address))")
      .eq("organization_id", organization.id)
      .eq("event_type", "arrival")
      .gte("occurred_at", startOfDay(rangeStartStr))
      .lt("occurred_at", startOfDay(rangeEndExclusiveStr))
      .order("occurred_at", { ascending: false })
      .limit(10),
    supabase
      .from("photos")
      .select("id, taken_at, uploaded_by, job_id, profiles(full_name), jobs(display_number)")
      .eq("organization_id", organization.id)
      .gte("taken_at", startOfDay(rangeStartStr))
      .lt("taken_at", startOfDay(rangeEndExclusiveStr))
      .order("taken_at", { ascending: false })
      .limit(30),
    supabase
      .from("jobs")
      .select("id, display_number, title, created_at, clients(name)")
      .eq("organization_id", organization.id)
      .gte("created_at", startOfDay(rangeStartStr))
      .lt("created_at", startOfDay(rangeEndExclusiveStr))
      .order("created_at", { ascending: false })
      .limit(10),
    // No time filter — a technician who's gone quiet (permission not yet
    // granted, dead zone, phone backgrounded a while) should still show
    // up at their last known spot, not disappear from the map entirely.
    supabase
      .from("technician_positions")
      .select("profile_id, lat, lng, recorded_at, profiles(full_name)")
      .eq("organization_id", organization.id),
  ]);

  const [{ data: trailLog }, { data: warehouses }] = await Promise.all([
    supabase
      .from("technician_position_log")
      .select("profile_id, lat, lng, recorded_at")
      .eq("organization_id", organization.id)
      .gte("recorded_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: true }),
    supabase.from("warehouses").select("id, name, address, lat, lng").eq("organization_id", organization.id),
  ]);

  // Profit = venitul facturat pentru lucrările programate în perioadă, minus
  // costul lor (materiale folosite + manoperă + combustibil estimat +
  // cheltuieli — aceeași metodă ca la costul pe lucrare individuală).
  const [
    { data: materialUsageInRange },
    { data: materialUsagePrevRange },
    { data: invoicesInRange },
    { data: invoicesPrevRange },
    { data: jobDistancesPrevRange },
  ] = await Promise.all([
    supabase
      .from("material_usage")
      .select("quantity, materials(unit_cost), jobs!inner(scheduled_date)")
      .eq("organization_id", organization.id)
      .gte("jobs.scheduled_date", rangeStartStr)
      .lte("jobs.scheduled_date", rangeEndStr),
    supabase
      .from("material_usage")
      .select("quantity, materials(unit_cost), jobs!inner(scheduled_date)")
      .eq("organization_id", organization.id)
      .gte("jobs.scheduled_date", prevStartStr)
      .lt("jobs.scheduled_date", prevEndExclusiveStr),
    supabase
      .from("invoices")
      .select("total_amount, jobs!inner(scheduled_date)")
      .eq("organization_id", organization.id)
      .gte("jobs.scheduled_date", rangeStartStr)
      .lte("jobs.scheduled_date", rangeEndStr),
    supabase
      .from("invoices")
      .select("total_amount, jobs!inner(scheduled_date)")
      .eq("organization_id", organization.id)
      .gte("jobs.scheduled_date", prevStartStr)
      .lt("jobs.scheduled_date", prevEndExclusiveStr),
    supabase
      .from("jobs")
      .select("distance_km")
      .eq("organization_id", organization.id)
      .gte("scheduled_date", prevStartStr)
      .lt("scheduled_date", prevEndExclusiveStr),
  ]);

  const materialsCostOf = (rows: { quantity: number; materials: { unit_cost: number | null } | null }[] | null) =>
    (rows ?? []).reduce((s, m) => s + Number(m.quantity) * (m.materials?.unit_cost ?? 0), 0);

  function laborCostOf(
    rows: { profile_id: string; event_type: string; occurred_at: string; profiles?: { hourly_rate: number | null } | null }[]
  ) {
    const byProfile = new Map<string, (typeof rows)[number][]>();
    for (const e of rows) {
      if (!byProfile.has(e.profile_id)) byProfile.set(e.profile_id, []);
      byProfile.get(e.profile_id)!.push(e);
    }
    let total = 0;
    for (const events of byProfile.values()) {
      const sorted = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
      const rate = sorted[0]?.profiles?.hourly_rate ?? null;
      let openStart: number | null = null;
      let hours = 0;
      for (const e of sorted) {
        const t = new Date(e.occurred_at).getTime();
        if (e.event_type === "work_start") openStart = t;
        else if (e.event_type === "work_end" && openStart != null) {
          hours += (t - openStart) / 3_600_000;
          openStart = null;
        }
      }
      total += hours * (rate ?? 0);
    }
    return total;
  }

  const revenueOf = (rows: { total_amount: number | null }[] | null) =>
    (rows ?? []).reduce((s, i) => s + Number(i.total_amount ?? 0), 0);

  const materialsCostInRange = materialsCostOf(materialUsageInRange);
  const materialsCostPrevRange = materialsCostOf(materialUsagePrevRange);
  const laborCostInRange = laborCostOf(timeEntriesToday ?? []);
  const laborCostPrevRange = laborCostOf(timeEntriesYesterday ?? []);
  const travelCostInRange = (jobsToday ?? []).reduce((s, j) => s + (j.distance_km ?? 0), 0) * organization.fuel_cost_per_km;
  const travelCostPrevRange =
    (jobDistancesPrevRange ?? []).reduce((s, j) => s + (j.distance_km ?? 0), 0) * organization.fuel_cost_per_km;
  const revenueInRange = revenueOf(invoicesInRange);
  const revenuePrevRange = revenueOf(invoicesPrevRange);

  const activeJobsList = activeJobs ?? [];
  const teamsInField = new Map(
    activeJobsList.filter((j) => j.team_id).map((j) => [j.team_id as string, j])
  );

  // Both were nested straight into the queries above (job_assignments on
  // jobsToday, teams.team_members on activeJobs) instead of separate
  // round trips — the dashboard was doing three extra sequential Supabase
  // calls after its main batch, which is exactly the kind of thing that
  // makes a page feel sluggish.
  const teamMemberNames = new Map<string, string[]>();
  for (const job of activeJobsList) {
    if (!job.team_id || teamMemberNames.has(job.team_id)) continue;
    const names = (job.teams?.team_members ?? [])
      .map((tm) => tm.profiles?.full_name)
      .filter((n): n is string => Boolean(n));
    teamMemberNames.set(job.team_id, names);
  }

  const assignedNames = new Map<string, string[]>();
  for (const job of jobsToday ?? []) {
    const names = (job.job_assignments ?? [])
      .map((a) => a.profiles?.full_name)
      .filter((n): n is string => Boolean(n));
    if (names.length > 0) assignedNames.set(job.id, names);
  }

  // KPIs
  const expensesToday = (expensesTodayRows ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const expensesYesterday = (expensesYesterdayRows ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const hoursToday = hoursWorked(timeEntriesToday ?? []);
  const hoursYesterday = hoursWorked(timeEntriesYesterday ?? []);

  const comparisonLabel = range === "azi" ? "față de ieri" : "față de perioada anterioară";
  const noComparisonLabel = range === "azi" ? "primele date de azi" : "primele date din perioadă";
  const sameLabel = range === "azi" ? "la fel ca ieri" : "la fel ca perioada anterioară";

  function percentTrend(current: number, previous: number) {
    if (previous <= 0) return current > 0 ? noComparisonLabel : null;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return sameLabel;
    return `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% ${comparisonLabel}`;
  }

  // A percentage trend is meaningless when the baseline is 0 or negative
  // (routine when nothing's invoiced yet) — profit gets an absolute RON
  // delta instead.
  function profitTrend(current: number, previous: number) {
    const diff = current - previous;
    if (diff === 0) return sameLabel;
    return `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(2)} RON ${comparisonLabel}`;
  }

  const totalCostInRange = materialsCostInRange + laborCostInRange + travelCostInRange + expensesToday;
  const totalCostPrevRange = materialsCostPrevRange + laborCostPrevRange + travelCostPrevRange + expensesYesterday;
  const profitInRange = revenueInRange - totalCostInRange;
  const profitPrevRange = revenuePrevRange - totalCostPrevRange;

  const activeYesterdayCount = new Set(
    (timeEntriesYesterday ?? [])
      .filter((e) => e.event_type === "work_start")
      .map((e) => e.job_id)
  ).size;
  const activeDelta = activeJobsList.length - activeYesterdayCount;
  const activeTrend =
    activeYesterdayCount === 0
      ? activeJobsList.length > 0
        ? noComparisonLabel
        : null
      : activeDelta === 0
        ? sameLabel
        : `${activeDelta > 0 ? "↑" : "↓"} ${Math.abs(activeDelta)} ${comparisonLabel}`;

  // Team pins for the map — one per team currently in the field.
  const mapMarkers: DashboardMapMarker[] = [...teamsInField.entries()]
    .map(([teamId, job], i) => {
      const lat = job.locations?.lat;
      const lng = job.locations?.lng;
      if (lat == null || lng == null) return null;
      const members = teamMemberNames.get(teamId) ?? [];
      return {
        id: teamId,
        label: members.length > 0 ? members.join(" + ") : job.teams?.name ?? "Echipă",
        sublabel: `${job.title} · ${job.clients?.name ?? "Client necunoscut"}`,
        statusLabel: JOB_STATUS_LABELS[job.status],
        color: TEAM_MAP_COLORS[i % TEAM_MAP_COLORS.length],
        lat,
        lng,
        href: `/lucrari/${job.id}`,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const livePositionMarkers: DashboardMapMarker[] = (livePositions ?? []).map((p) => {
    const minutesAgo = Math.round((Date.now() - new Date(p.recorded_at).getTime()) / 60000);
    const isLive = minutesAgo <= 3;
    const isStale = minutesAgo > 15;
    return {
      id: `pos-${p.profile_id}`,
      label: `📍 ${p.profiles?.full_name ?? "Tehnician"}`,
      sublabel: isStale ? "Ultima poziție cunoscută (offline)" : "Poziție live",
      statusLabel: minutesAgo <= 1 ? "chiar acum" : minutesAgo < 60 ? `acum ${minutesAgo} min` : `acum ${Math.round(minutesAgo / 60)} h`,
      color: isLive ? "#15803d" : isStale ? "#98a2b3" : "#0369a1",
      lat: p.lat,
      lng: p.lng,
    };
  });

  const hqMarker: DashboardMapMarker[] =
    organization?.hq_lat != null && organization?.hq_lng != null
      ? [
          {
            id: "hq",
            label: "🏢 Sediu",
            sublabel: organization.address ?? organization.name,
            statusLabel: "Sediul administrativ",
            color: "#101828",
            lat: organization.hq_lat,
            lng: organization.hq_lng,
          },
        ]
      : [];

  const warehouseMarkers: DashboardMapMarker[] = (warehouses ?? [])
    .filter((w) => w.lat != null && w.lng != null)
    .map((w) => ({
      id: `wh-${w.id}`,
      label: `🏭 ${w.name}`,
      sublabel: w.address ?? "",
      statusLabel: "Depozit",
      color: "#7c2d12",
      lat: w.lat!,
      lng: w.lng!,
    }));

  const allMapMarkers = [...mapMarkers, ...livePositionMarkers, ...hqMarker, ...warehouseMarkers];

  const trailsByProfile = new Map<string, [number, number][]>();
  for (const p of trailLog ?? []) {
    if (!trailsByProfile.has(p.profile_id)) trailsByProfile.set(p.profile_id, []);
    trailsByProfile.get(p.profile_id)!.push([p.lat, p.lng]);
  }
  const trails = [...trailsByProfile.entries()].map(([profileId, points]) => ({
    id: `trail-${profileId}`,
    color: "#0369a1",
    points,
  }));

  // Unified activity feed — merges status changes, arrivals, expenses,
  // photo uploads and new jobs into one real, timestamp-sorted stream.
  const activity: ActivityItem[] = [];

  for (const h of historyToday ?? []) {
    const name = h.profiles?.full_name ?? "Cineva";
    const jobRef = h.jobs ? `#${h.jobs.display_number}` : "";
    if (h.status === "finalizata") {
      activity.push({
        key: `h-${h.id}`,
        at: h.created_at,
        icon: CheckCircle2,
        iconColor: "text-success",
        text: `${name} a finalizat lucrarea ${jobRef}`,
      });
    } else if (h.status === "necesita_atentie") {
      activity.push({
        key: `h-${h.id}`,
        at: h.created_at,
        icon: AlertTriangle,
        iconColor: "text-danger",
        text: `Lucrarea ${jobRef} necesită atenție`,
      });
    } else {
      activity.push({
        key: `h-${h.id}`,
        at: h.created_at,
        icon: Activity,
        iconColor: "text-info",
        text: `${name} a schimbat starea lucrării ${jobRef} în ${JOB_STATUS_LABELS[h.status]}`,
      });
    }
  }

  for (const a of arrivalsToday ?? []) {
    const name = a.profiles?.full_name ?? "Cineva";
    const jobRef = a.jobs ? `#${a.jobs.display_number}` : "";
    const address = a.jobs?.locations?.address;
    activity.push({
      key: `a-${a.id}`,
      at: a.occurred_at,
      icon: Navigation,
      iconColor: "text-electric",
      text: `${name} a ajuns la locație${address ? ` — ${address}` : ` (lucrarea ${jobRef})`}`,
    });
  }

  for (const e of expensesTodayRows ?? []) {
    const jobRef = e.jobs ? `#${e.jobs.display_number}` : "";
    activity.push({
      key: `e-${e.id}`,
      at: e.created_at,
      icon: Receipt,
      iconColor: "text-warning",
      text: `S-a înregistrat o cheltuială de ${Number(e.amount).toFixed(2)} RON${
        e.vendor ? ` — ${e.vendor}` : ""
      }, lucrarea ${jobRef}`,
    });
  }

  const photoGroups = new Map<
    string,
    { name: string; jobRef: string; count: number; latest: string }
  >();
  for (const p of photosToday ?? []) {
    const key = `${p.uploaded_by}:${p.job_id}`;
    const existing = photoGroups.get(key);
    if (existing) {
      existing.count += 1;
      if (p.taken_at > existing.latest) existing.latest = p.taken_at;
    } else {
      photoGroups.set(key, {
        name: p.profiles?.full_name ?? "Cineva",
        jobRef: p.jobs ? `#${p.jobs.display_number}` : "",
        count: 1,
        latest: p.taken_at,
      });
    }
  }
  for (const [key, g] of photoGroups) {
    activity.push({
      key: `p-${key}`,
      at: g.latest,
      icon: Camera,
      iconColor: "text-electric",
      text: `${g.name} a încărcat ${g.count} ${g.count === 1 ? "fotografie" : "fotografii"} la lucrarea ${g.jobRef}`,
    });
  }

  for (const j of jobsCreatedToday ?? []) {
    activity.push({
      key: `j-${j.id}`,
      at: j.created_at,
      icon: Plus,
      iconColor: "text-muted",
      text: `S-a creat lucrarea nouă #${j.display_number} — ${j.title}, ${j.clients?.name ?? "client nou"}`,
    });
  }

  activity.sort((a, b) => b.at.localeCompare(a.at));
  const recentActivity = activity.slice(0, 6);

  return (
    <div className="flex flex-col gap-5 p-7">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            {range === "azi"
              ? "Iată ce se întâmplă astăzi în echipele tale."
              : "Iată ce s-a întâmplat în ultimele 7 zile în echipele tale."}
          </p>
        </div>
        <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <Link
            href="/dashboard"
            className={`rounded-[7px] px-4 py-1.5 text-center text-[12.5px] ${
              range === "azi" ? "bg-white font-bold shadow-sm" : "font-semibold text-muted"
            }`}
          >
            Astăzi
          </Link>
          <Link
            href="/dashboard?range=7zile"
            className={`rounded-[7px] px-4 py-1.5 text-center text-[12.5px] ${
              range === "7zile" ? "bg-white font-bold shadow-sm" : "font-semibold text-muted"
            }`}
          >
            Ultimele 7 zile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Lucrări active"
          value={activeJobsList.length}
          trend={activeTrend}
          icon={Briefcase}
          iconBg="bg-electric-soft"
          iconColor="text-electric"
        />
        <KpiCard
          label="Echipe în teren"
          value={`${teamsInField.size}`}
          trend={`din ${activeTeamsCount ?? 0} echipe`}
          icon={UsersRound}
          iconBg="bg-success-bg"
          iconColor="text-success"
        />
        <KpiCard
          label={range === "azi" ? "Ore lucrate azi" : "Ore lucrate (7 zile)"}
          value={formatHours(hoursToday)}
          trend={percentTrend(hoursToday, hoursYesterday)}
          icon={Clock}
          iconBg="bg-warning-bg"
          iconColor="text-warning"
        />
        <KpiCard
          label={range === "azi" ? "Cheltuieli azi" : "Cheltuieli (7 zile)"}
          value={`${expensesToday.toFixed(2)} RON`}
          trend={percentTrend(expensesToday, expensesYesterday)}
          icon={Receipt}
          iconBg="bg-danger-bg"
          iconColor="text-danger"
        />
        <KpiCard
          label={range === "azi" ? "Profit azi" : "Profit (7 zile)"}
          value={`${profitInRange.toFixed(2)} RON`}
          trend={profitTrend(profitInRange, profitPrevRange)}
          icon={TrendingUp}
          iconBg={profitInRange >= 0 ? "bg-purple-soft" : "bg-danger-bg"}
          iconColor={profitInRange >= 0 ? "text-purple" : "text-danger"}
        />
      </div>
      <p className="-mt-2 text-[11.5px] text-muted-2">
        Profit = venit facturat (facturi emise pentru lucrările din perioadă) − cost (materiale folosite + manoperă +
        combustibil estimat + cheltuieli). Lucrările nefacturate încă apar doar ca și cost.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[13px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-[#f2f4f7] px-5 py-3.5">
            <h2 className="text-[15px] font-bold text-foreground">
              {range === "azi" ? "Lucrări programate astăzi" : "Lucrări programate (ultimele 7 zile)"}
            </h2>
            <Link href="/lucrari" className="text-[12.5px] font-semibold text-electric">
              Vezi toate lucrările →
            </Link>
          </div>

          {jobsToday && jobsToday.length > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {jobsToday.map((job) => {
                const duration = formatDuration(job.start_time, job.end_time);
                const names = assignedNames.get(job.id);
                return (
                  <Link
                    key={job.id}
                    href={`/lucrari/${job.id}`}
                    prefetch={false}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]"
                  >
                    <div className="w-14 shrink-0">
                      <div className="text-[13px] font-bold text-foreground">
                        {job.start_time?.slice(0, 5) ?? "—"}
                      </div>
                      {duration && (
                        <div className="text-[11px] text-muted-2">{duration}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-foreground">
                        {job.clients?.name ?? "Client necunoscut"}
                      </div>
                      <div className="truncate text-[12.5px] text-muted">
                        {job.title} · {job.locations?.address ?? "fără adresă"}
                      </div>
                      <div className="truncate text-[11.5px] text-muted-2">
                        Echipă: {names && names.length > 0 ? names.join(" + ") : "neasignată"}
                      </div>
                    </div>
                    <StatusBadge
                      label={JOB_STATUS_LABELS[job.status]}
                      className={JOB_STATUS_STYLES[job.status]}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Briefcase}
                title="Nicio lucrare programată astăzi"
                description="Creează prima lucrare pentru a o vedea aici și în calendarul echipei."
                action={
                  <Link
                    href="/lucrari/nou"
                    className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
                  >
                    <Plus className="h-4 w-4" /> Lucrare nouă
                  </Link>
                }
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[13px] border border-border bg-white">
            <div className="flex items-center justify-between border-b border-[#f2f4f7] px-4 py-3">
              <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
                <MapPin className="h-4 w-4 text-muted" /> Echipe pe hartă
              </h2>
            </div>
            <div className="h-[200px] p-2.5">
              {allMapMarkers.length > 0 ? (
                <DashboardMapLoader markers={allMapMarkers} trails={trails} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[10px] bg-[#f9fafb] text-center">
                  <p className="text-[12.5px] font-semibold text-foreground">
                    Nicio echipă în teren chiar acum
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-[#f2f4f7] px-4 py-2.5 text-right">
              <Link href="/harta" className="text-[12px] font-semibold text-electric">
                Deschide harta →
              </Link>
            </div>
          </div>

          <div className="rounded-[13px] border border-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[14.5px] font-bold text-foreground">
              <Activity className="h-4 w-4 text-muted" /> Activitate recentă
            </h2>

            {recentActivity.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {recentActivity.map((item) => (
                  <div key={item.key} className="flex items-start gap-2.5">
                    <item.icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${item.iconColor}`}
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] leading-relaxed text-[#344054]">
                        {item.text}
                      </div>
                      <div className="text-[11px] text-muted-2">
                        {new Date(item.at).toLocaleString("ro-RO")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">
                Aici vor apărea evenimentele echipei: sosiri, fotografii, cheltuieli
                și lucrări finalizate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  trend?: string | null;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-[13px] border border-border bg-white p-[18px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between">
        <div className="text-[13px] font-semibold text-muted">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-[9px] ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-2.5 text-[28px] font-extrabold text-foreground">{value}</div>
      {trend && (
        <div className="mt-1 text-[12px] font-medium text-muted-2">{trend}</div>
      )}
    </div>
  );
}

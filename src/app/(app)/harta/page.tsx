import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { DashboardMapLoader } from "@/components/dashboard-map-loader";
import type { DashboardMapMarker } from "@/components/dashboard-map";
import { JOB_STATUS_LABELS } from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";
import { MapPin, AlertTriangle } from "lucide-react";
import { resolveJobAlert } from "./actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { todayInOrgTimeZone } from "@/lib/date";

type JobStatus = Database["public"]["Enums"]["job_status"];

const TEAM_MAP_COLORS = ["#15803d", "#1e293b", "#c2410c", "#7c3aed", "#0369a1"];
const ACTIVE_STATUSES: JobStatus[] = ["in_lucru", "in_drum", "ajunsa", "pauza"];

function startOfDay(dateStr: string) {
  return `${dateStr}T00:00:00`;
}

export default async function HartaPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const [{ data: activeJobs }, { data: teams }, { data: scheduledToday }, { data: arrivalsToday }, { data: livePositions }, { data: openAlerts }, { data: warehouses }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, display_number, title, status, team_id, clients(name), teams(name, team_members(profiles(full_name))), locations(address, lat, lng)"
        )
        .eq("organization_id", organization.id)
        .in("status", ACTIVE_STATUSES),
      supabase
        .from("teams")
        .select("id, name, team_members(profiles(full_name))")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("jobs")
        .select("id, display_number, title, team_id, start_time, clients(name)")
        .eq("organization_id", organization.id)
        .eq("scheduled_date", today)
        .eq("status", "programata")
        .not("team_id", "is", null)
        .order("start_time", { ascending: true, nullsFirst: false }),
      supabase
        .from("time_entries")
        .select("job_id, occurred_at")
        .eq("organization_id", organization.id)
        .eq("event_type", "arrival")
        .gte("occurred_at", startOfDay(today))
        .order("occurred_at", { ascending: false }),
      // No time filter — a technician who's gone quiet (permission not yet
      // granted, dead zone, phone backgrounded a while) should still show
      // up at their last known spot, not disappear from the map entirely.
      supabase
        .from("technician_positions")
        .select("profile_id, lat, lng, recorded_at, profiles(full_name)")
        .eq("organization_id", organization.id),
      supabase
        .from("job_alerts")
        .select("id, job_id, kind, message, created_at, jobs(display_number)")
        .eq("organization_id", organization.id)
        .is("resolved_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("warehouses")
        .select("id, name, address, lat, lng")
        .eq("organization_id", organization.id),
    ]);

  const { data: trailLog } = await supabase
    .from("technician_position_log")
    .select("profile_id, lat, lng, recorded_at")
    .eq("organization_id", organization.id)
    .gte("recorded_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: true });

  const arrivalByJob = new Map<string, string>();
  for (const a of arrivalsToday ?? []) {
    if (!arrivalByJob.has(a.job_id)) arrivalByJob.set(a.job_id, a.occurred_at);
  }

  const activeByTeam = new Map((activeJobs ?? []).filter((j) => j.team_id).map((j) => [j.team_id as string, j]));
  const scheduledByTeam = new Map(
    (scheduledToday ?? []).filter((j) => j.team_id).map((j) => [j.team_id as string, j])
  );

  type Row = {
    teamId: string;
    members: string;
    kind: "live" | "scheduled" | "available";
    dotColor: string;
    jobId: string | null;
    jobRef: string | null;
    detail: string;
  };

  const rows: Row[] = (teams ?? []).map((team) => {
    const members = team.team_members.map((m) => m.profiles?.full_name).filter(Boolean).join(" + ") || team.name;
    const activeJob = activeByTeam.get(team.id);
    if (activeJob) {
      const arrival = arrivalByJob.get(activeJob.id);
      const arrivalLabel = arrival
        ? `Ajuns ${new Date(arrival).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}`
        : JOB_STATUS_LABELS[activeJob.status];
      return {
        teamId: team.id,
        members,
        kind: "live",
        dotColor: activeJob.status === "in_drum" || activeJob.status === "ajunsa" ? "#B45309" : "#15803D",
        jobId: activeJob.id,
        jobRef: `#${activeJob.display_number} · ${activeJob.title}`,
        detail:
          activeJob.status === "in_drum"
            ? "În drum"
            : `${arrivalLabel} · ${activeJob.locations?.address ?? "adresă necunoscută"}`,
      };
    }
    const scheduled = scheduledByTeam.get(team.id);
    if (scheduled) {
      return {
        teamId: team.id,
        members,
        kind: "scheduled",
        dotColor: "#667085",
        jobId: scheduled.id,
        jobRef: `#${scheduled.display_number} · ${scheduled.title}`,
        detail: scheduled.start_time
          ? `Programată ${scheduled.start_time.slice(0, 5)}`
          : "Programată azi",
      };
    }
    return {
      teamId: team.id,
      members,
      kind: "available",
      dotColor: "#15803D",
      jobId: null,
      jobRef: null,
      detail: "Disponibilă",
    };
  });

  rows.sort((a, b) => {
    const order = { live: 0, scheduled: 1, available: 2 };
    return order[a.kind] - order[b.kind];
  });

  const mapMarkers: DashboardMapMarker[] = [...activeByTeam.entries()]
    .map(([teamId, job], i) => {
      const lat = job.locations?.lat;
      const lng = job.locations?.lng;
      if (lat == null || lng == null) return null;
      const members = job.teams?.team_members?.map((m) => m.profiles?.full_name).filter(Boolean) ?? [];
      return {
        id: teamId,
        label: members.length > 0 ? members.join(" + ") : job.teams?.name ?? "Echipă",
        sublabel: `#${job.display_number} · ${job.title} · ${job.clients?.name ?? "Client necunoscut"}`,
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

  return (
    <div className="flex h-full flex-col">
      <AutoRefresh />
      {(openAlerts ?? []).length > 0 && (
        <div className="flex flex-col gap-1.5 border-b border-[#fee4e2] bg-[#fef3f2] px-5 py-2.5">
          {(openAlerts ?? []).map((alert) => (
            <div key={alert.id} className="flex items-center gap-2.5 text-[12.5px]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
              <span className="flex-1 text-[#7a271a]">{alert.message}</span>
              <Link
                href={`/lucrari/${alert.job_id}`}
                className="shrink-0 rounded-[8px] border border-[#7a271a]/30 px-2.5 py-1 text-[11px] font-bold text-[#7a271a]"
              >
                Vezi lucrarea
              </Link>
              <form action={resolveJobAlert}>
                <input type="hidden" name="alertId" value={alert.id} />
                <button type="submit" className="shrink-0 rounded-[8px] bg-white px-2.5 py-1 text-[11px] font-bold text-[#7a271a]">
                  Marchează rezolvat
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
      <div className="flex w-[320px] shrink-0 flex-col border-r border-border bg-white">
        <div className="px-[18px] pb-3 pt-[18px] text-[16px] font-extrabold text-foreground">
          Echipe pe teren
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3">
          {rows.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-muted">Nicio echipă activă încă.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {rows.map((row) => {
                const content = (
                  <>
                    <div
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: row.dotColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-foreground">{row.members}</div>
                      {row.jobRef && (
                        <div className="truncate text-[12px] text-muted">{row.jobRef}</div>
                      )}
                      <div className="truncate text-[11px] text-muted-2">{row.detail}</div>
                    </div>
                  </>
                );
                return row.jobId ? (
                  <Link
                    key={row.teamId}
                    href={`/lucrari/${row.jobId}`}
                    prefetch={false}
                    className={`flex gap-2.5 rounded-[10px] p-2.5 hover:bg-[#f9fafb] ${
                      row.kind === "live" ? "border border-[#d9e6ff] bg-[#f0f5ff] hover:bg-[#f0f5ff]" : ""
                    }`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={row.teamId} className="flex gap-2.5 rounded-[10px] p-2.5">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        {allMapMarkers.length > 0 ? (
          <DashboardMapLoader markers={allMapMarkers} trails={trails} />
        ) : (
          <EmptyState
            icon={MapPin}
            title="Nicio echipă pe teren acum"
            description="Harta arată echipele care sunt în drum sau în lucru chiar acum. Momentan nu e nicio lucrare activă cu locație GPS."
          />
        )}
      </div>
      </div>
    </div>
  );
}

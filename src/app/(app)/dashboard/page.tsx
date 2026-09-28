import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { DashboardMapLoader } from "@/components/dashboard-map-loader";
import type { DashboardMapJob } from "@/components/dashboard-map";
import {
  Briefcase,
  UsersRound,
  Receipt,
  CalendarClock,
  AlertTriangle,
  Package,
  Plus,
  Activity,
  MapPin,
} from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}

export default async function DashboardPage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const firstName = profile.full_name.split(" ")[0];
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: jobsToday },
    { data: activeJobs },
    expensesTodayAgg,
    { count: overdueCount },
    { count: materialUsageTodayCount },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, display_number, title, job_type, status, start_time, end_time, clients(name), locations(address, lat, lng), teams(name)"
      )
      .eq("organization_id", organization.id)
      .eq("scheduled_date", today)
      .order("start_time", { ascending: true, nullsFirst: true }),
    supabase
      .from("jobs")
      .select(
        "id, display_number, title, status, team_id, clients(name), teams(name), locations(lat, lng)"
      )
      .eq("organization_id", organization.id)
      .in("status", ["in_lucru", "in_drum", "ajunsa", "pauza"]),
    supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", organization.id)
      .eq("expense_date", today),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .lt("scheduled_date", today)
      .not("status", "in", "(finalizata,anulata)"),
    supabase
      .from("material_usage")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .gte("used_at", `${today}T00:00:00`)
      .lte("used_at", `${today}T23:59:59`),
  ]);

  const activeJobsList = activeJobs ?? [];
  const teamsInField = new Map(
    activeJobsList
      .filter((j) => j.team_id)
      .map((j) => [j.team_id as string, j])
  );
  const expensesToday = (expensesTodayAgg.data ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  // Prefer jobs currently in motion; fall back to the rest of today's
  // schedule so the map isn't empty on a quiet day with nothing active yet.
  const mapCandidates = [...activeJobsList, ...(jobsToday ?? [])];
  const seenMapJobIds = new Set<string>();
  const mapJobs: DashboardMapJob[] = [];
  for (const job of mapCandidates) {
    const lat = job.locations?.lat;
    const lng = job.locations?.lng;
    if (seenMapJobIds.has(job.id) || lat == null || lng == null) continue;
    seenMapJobIds.add(job.id);
    mapJobs.push({
      id: job.id,
      displayNumber: job.display_number,
      title: job.title,
      clientName: job.clients?.name ?? "Client necunoscut",
      status: job.status,
      lat,
      lng,
    });
  }

  // RLS already scopes this to the current organization via the jobs join.
  const { data: recentHistory } = await supabase
    .from("job_status_history")
    .select("id, status, created_at, jobs(display_number, title)")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Iată ce se întâmplă astăzi în echipele tale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Lucrări active"
          value={activeJobsList.length}
          icon={Briefcase}
          iconBg="bg-electric-soft"
          iconColor="text-electric"
        />
        <KpiCard
          label="Echipe în teren"
          value={teamsInField.size}
          icon={UsersRound}
          iconBg="bg-success-bg"
          iconColor="text-success"
        />
        <KpiCard
          label="Lucrări programate azi"
          value={jobsToday?.length ?? 0}
          icon={CalendarClock}
          iconBg="bg-warning-bg"
          iconColor="text-warning"
        />
        <KpiCard
          label="Cheltuieli azi"
          value={`${expensesToday.toFixed(2)} RON`}
          icon={Receipt}
          iconBg="bg-danger-bg"
          iconColor="text-danger"
        />
        <KpiCard
          label="Lucrări întârziate"
          value={overdueCount ?? 0}
          icon={AlertTriangle}
          iconBg="bg-danger-bg"
          iconColor="text-danger"
        />
        <KpiCard
          label="Materiale consumate azi"
          value={materialUsageTodayCount ?? 0}
          icon={Package}
          iconBg="bg-electric-soft"
          iconColor="text-electric"
        />
      </div>

      <div className="rounded-[13px] border border-border bg-white">
        <div className="flex items-center justify-between border-b border-[#f2f4f7] px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
            <MapPin className="h-4 w-4 text-muted" /> Hartă live — lucrări active
          </h2>
          <Link href="/harta" className="text-[12.5px] font-semibold text-electric">
            Vezi harta completă →
          </Link>
        </div>
        <div className="h-[320px] p-3">
          {mapJobs.length > 0 ? (
            <DashboardMapLoader jobs={mapJobs} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[10px] bg-[#f9fafb] text-center">
              <p className="text-[13px] font-semibold text-foreground">
                Nicio locație de afișat încă
              </p>
              <p className="max-w-xs text-[12.5px] text-muted">
                Adaugă adrese cu coordonate la clienți pentru a vedea lucrările pe hartă.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[13px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-[#f2f4f7] px-5 py-3.5">
            <h2 className="text-[15px] font-bold text-foreground">
              Lucrări programate astăzi
            </h2>
            <Link href="/lucrari" className="text-[12.5px] font-semibold text-electric">
              Vezi toate lucrările →
            </Link>
          </div>

          {jobsToday && jobsToday.length > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {jobsToday.map((job) => (
                <Link
                  key={job.id}
                  href={`/lucrari/${job.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]"
                >
                  <div className="w-14 shrink-0 text-[13px] font-bold text-foreground">
                    {job.start_time?.slice(0, 5) ?? "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-foreground">
                      {job.clients?.name ?? "Client necunoscut"}
                    </div>
                    <div className="truncate text-[12.5px] text-muted">
                      {job.title} · {job.locations?.address ?? "fără adresă"}
                    </div>
                  </div>
                  <StatusBadge
                    label={JOB_STATUS_LABELS[job.status]}
                    className={JOB_STATUS_STYLES[job.status]}
                  />
                </Link>
              ))}
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
        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[14.5px] font-bold text-foreground">
            <UsersRound className="h-4 w-4 text-muted" /> Echipe active acum
          </h2>

          {teamsInField.size > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {[...teamsInField.values()].map((job) => (
                <Link
                  key={job.id}
                  href={`/lucrari/${job.id}`}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="h-2 w-2 shrink-0 rounded-full bg-electric" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-foreground">
                      {job.teams?.name ?? "Echipă"}
                    </div>
                    <div className="truncate text-[11.5px] text-muted-2">
                      #{job.display_number} · {job.clients?.name ?? "—"}
                    </div>
                  </div>
                  <StatusBadge
                    label={JOB_STATUS_LABELS[job.status]}
                    className={`${JOB_STATUS_STYLES[job.status]} shrink-0`}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">
              Nicio echipă nu are o lucrare activă chiar acum.
            </p>
          )}
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[14.5px] font-bold text-foreground">
            <Activity className="h-4 w-4 text-muted" /> Activitate recentă
          </h2>

          {recentHistory && recentHistory.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentHistory.map((h) => (
                <div key={h.id} className="text-[12.5px] leading-relaxed text-[#344054]">
                  Lucrarea <b>#{h.jobs?.display_number}</b> —{" "}
                  {JOB_STATUS_LABELS[h.status]}
                  <div className="text-[11px] text-muted-2">
                    {new Date(h.created_at).toLocaleString("ro-RO")}
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
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
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
      <div className="mt-2.5 text-[28px] font-extrabold text-foreground">
        {value}
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  JOB_TYPE_LABELS,
  JOB_PRIORITY_LABELS,
  JOB_PRIORITY_COLOR,
} from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";
import { Briefcase, Plus, Calendar, ArrowLeft } from "lucide-react";

type JobStatus = Database["public"]["Enums"]["job_status"];

// Same 7 statuses the mockup filters by — "ajunsă" is a brief in-transit
// state with no dedicated pill there either; "Toate" still includes it.
const STATUS_PILLS: JobStatus[] = [
  "programata",
  "in_drum",
  "in_lucru",
  "pauza",
  "finalizata",
  "necesita_atentie",
  "anulata",
];

export default async function LucrariPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string }>;
}) {
  const { status, clientId } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: jobs }, { data: allStatuses }, { data: client }] = await Promise.all([
    (() => {
      let query = supabase
        .from("jobs")
        .select(
          "id, display_number, title, job_type, status, priority, scheduled_date, start_time, end_time, clients(name), locations(address), teams(name), job_assignments(profiles(full_name))"
        )
        .eq("organization_id", organization.id);
      if (status && STATUS_PILLS.includes(status as JobStatus)) {
        query = query.eq("status", status as JobStatus);
      }
      if (clientId) query = query.eq("client_id", clientId);
      return query.order("created_at", { ascending: false });
    })(),
    (() => {
      let q = supabase.from("jobs").select("status").eq("organization_id", organization.id);
      if (clientId) q = q.eq("client_id", clientId);
      return q;
    })(),
    clientId
      ? supabase.from("clients").select("id, name").eq("id", clientId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const statusHref = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (clientId) params.set("clientId", clientId);
    return params.toString() ? `/lucrari?${params}` : "/lucrari";
  };

  const statusCounts = new Map<JobStatus, number>();
  for (const row of allStatuses ?? []) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }
  const totalCount = allStatuses?.length ?? 0;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-extrabold text-foreground">Lucrări</h1>
          {client && (
            <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
              Filtrat pentru <span className="font-semibold text-foreground">{client.name}</span>
              <Link href="/lucrari" className="flex items-center gap-1 font-semibold text-electric">
                <ArrowLeft className="h-3 w-3" /> vezi toate
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
          >
            <Calendar className="h-3.5 w-3.5" /> Vezi în calendar
          </Link>
          <Link
            href={clientId ? `/lucrari/nou?clientId=${clientId}` : "/lucrari/nou"}
            className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Lucrare nouă
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={statusHref("")}
          className={`rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold ${
            !status ? "bg-[#101828] text-white" : "bg-neutral-bg text-[#475467]"
          }`}
        >
          Toate ({totalCount})
        </Link>
        {STATUS_PILLS.map((s) => (
          <Link
            key={s}
            href={statusHref(s)}
            className={`rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold ${
              status === s ? "bg-[#101828] text-white" : JOB_STATUS_STYLES[s]
            }`}
          >
            {JOB_STATUS_LABELS[s]} ({statusCounts.get(s) ?? 0})
          </Link>
        ))}
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Client / Tip</th>
                <th className="px-5 py-3">Adresă</th>
                <th className="px-5 py-3">Echipă</th>
                <th className="px-5 py-3">Dată / Interval</th>
                <th className="px-5 py-3">Prioritate</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const assignees = job.job_assignments
                  .map((a) => a.profiles?.full_name)
                  .filter((name): name is string => Boolean(name));
                return (
                  <tr key={job.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb]">
                    <td className="px-5 py-3.5">
                      <Link href={`/lucrari/${job.id}`} prefetch={false} className="text-[13px] font-bold text-electric">
                        #{job.display_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[13.5px] font-bold text-foreground">
                        {job.clients?.name ?? "—"}
                      </div>
                      <div className="text-[12px] text-muted-2">
                        {JOB_TYPE_LABELS[job.job_type]}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                      {job.locations?.address ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                      {job.teams?.name ? (
                        <>
                          <div className="font-bold text-foreground">{job.teams.name}</div>
                          {assignees.length > 0 && (
                            <div className="text-[11.5px] text-muted-2">{assignees.join(", ")}</div>
                          )}
                        </>
                      ) : (
                        "neasignată"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                      {job.scheduled_date}
                      {job.start_time ? ` · ${job.start_time.slice(0, 5)}` : ""}
                      {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: JOB_PRIORITY_COLOR[job.priority] }}
                      >
                        ● {JOB_PRIORITY_LABELS[job.priority]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={JOB_STATUS_LABELS[job.status]}
                        className={JOB_STATUS_STYLES[job.status]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={status ? "Nicio lucrare cu acest status" : "Nicio lucrare încă"}
          description={
            status
              ? "Încearcă alt filtru de status."
              : "Creează prima lucrare pentru a începe să urmărești programările echipei."
          }
          action={
            !status && (
              <Link
                href="/lucrari/nou"
                className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
              >
                <Plus className="h-4 w-4" /> Lucrare nouă
              </Link>
            )
          }
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "./status-actions";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  JOB_TYPE_LABELS,
  JOB_PRIORITY_LABELS,
} from "@/lib/status";
import { ArrowLeft, MapPin, UsersRound, Calendar } from "lucide-react";

const TABS = [
  "Rezumat",
  "Materiale",
  "Fotografii",
  "Cheltuieli",
  "Pontaj",
  "Checklist",
  "Raport",
] as const;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  // job_status_history is a to-many FK on job_id, so it comes back nested
  // on the same query instead of a second round trip.
  const { data: job } = await supabase
    .from("jobs")
    .select(
      "*, clients(id, name), locations(address), teams(id, name), job_status_history(id, status, created_at, profiles(full_name))"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .order("created_at", { ascending: true, foreignTable: "job_status_history" })
    .maybeSingle();

  if (!job) notFound();

  const history = job.job_status_history;

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-border bg-white px-7 py-4.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/lucrari"
            prefetch={false}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-neutral-bg"
          >
            <ArrowLeft className="h-[15px] w-[15px] text-[#344054]" />
          </Link>
          <h1 className="text-[17px] font-extrabold text-foreground">
            Lucrare #{job.display_number} — {job.title}
          </h1>
          <StatusBadge
            label={JOB_STATUS_LABELS[job.status]}
            className={JOB_STATUS_STYLES[job.status]}
          />
          <div className="flex-1" />
          <StatusActions jobId={job.id} status={job.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-6 text-[13px] text-[#475467]">
          {job.clients && (
            <Link
              href={`/clienti/${job.clients.id}`}
              prefetch={false}
              className="flex items-center gap-1.5 font-semibold"
            >
              <UsersRound className="h-3.5 w-3.5 text-muted" /> {job.clients.name}
            </Link>
          )}
          {job.locations?.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted" /> {job.locations.address}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted" /> {job.scheduled_date}
            {job.start_time ? ` · ${job.start_time.slice(0, 5)}` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 text-muted" />{" "}
            {job.teams?.name ?? "echipă neasignată"}
          </span>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab, i) => (
            <div
              key={tab}
              className={`whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold ${
                i === 0
                  ? "border-b-2 border-electric text-electric"
                  : "text-muted"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-7 xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[13px] border border-border bg-white p-5">
            <h2 className="mb-3.5 text-[14.5px] font-bold text-foreground">
              Informații generale
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <InfoField label="DATA" value={job.scheduled_date} />
              <InfoField label="TIP LUCRARE" value={JOB_TYPE_LABELS[job.job_type]} />
              <InfoField
                label="PRIORITATE"
                value={JOB_PRIORITY_LABELS[job.priority]}
              />
              <InfoField
                label="ORA SOSIRII"
                value={job.arrived_at ? new Date(job.arrived_at).toLocaleTimeString("ro-RO") : "—"}
              />
              <InfoField
                label="ÎNCEPUT LUCRU"
                value={job.work_started_at ? new Date(job.work_started_at).toLocaleTimeString("ro-RO") : "—"}
              />
              <InfoField
                label="FINALIZARE"
                value={job.work_ended_at ? new Date(job.work_ended_at).toLocaleTimeString("ro-RO") : "—"}
              />
            </div>
            {job.description && (
              <div className="mt-4 border-t border-[#f2f4f7] pt-4">
                <div className="text-[11.5px] font-semibold text-muted-2">
                  DESCRIERE
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#344054]">
                  {job.description}
                </p>
              </div>
            )}
          </div>

          {(["Materiale", "Fotografii", "Cheltuieli", "Checklist", "Raport"] as const).map(
            (label) => (
              <div key={label} className="rounded-[13px] border border-dashed border-border bg-white p-5">
                <h2 className="text-[14.5px] font-bold text-foreground">{label}</h2>
                <p className="mt-1.5 text-[13px] text-muted">
                  Vine în etapa următoare — deocamdată doar fluxul lucrării (status, client, echipă).
                </p>
              </div>
            )
          )}
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="mb-3.5 text-[14.5px] font-bold text-foreground">
            Istoric status
          </h2>
          {history && history.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {history.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-electric" />
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">
                      {JOB_STATUS_LABELS[h.status]}
                    </div>
                    <div className="text-[11.5px] text-muted-2">
                      {h.profiles?.full_name ?? "Sistem"} ·{" "}
                      {new Date(h.created_at).toLocaleString("ro-RO")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Niciun eveniment încă.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold text-muted-2">{label}</div>
      <div className="mt-1 text-[13.5px] font-bold text-foreground">{value}</div>
    </div>
  );
}

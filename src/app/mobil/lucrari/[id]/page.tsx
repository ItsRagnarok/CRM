import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, ChevronRight } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { startWork } from "./actions";
import { ArriveButton } from "./arrive-button";
import { StartTravelButton } from "./start-travel-button";

function mapsHref(address: string | null, lat: number | null, lng: number | null) {
  if (lat != null && lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return null;
}

export default async function MobileJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, display_number, title, description, status, scheduled_date, start_time, end_time, arrived_at, work_started_at, work_ended_at, observations, clients(name, phone), locations(address, lat, lng)"
    )
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!job) notFound();

  const maps = mapsHref(job.locations?.address ?? null, job.locations?.lat ?? null, job.locations?.lng ?? null);
  const isTraveling = job.status === "programata" || job.status === "in_drum";
  const isDone = job.status === "finalizata";
  const isWorking = job.status === "in_lucru" || job.status === "pauza";

  const [{ count: photoCount }, { count: expenseCount }] = isWorking
    ? await Promise.all([
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("job_id", id),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">
            #{job.display_number} — {job.title}
          </div>
          <div className="text-[11.5px] text-muted-2">{job.clients?.name ?? "Client"}</div>
        </div>
        <div className="flex-1" />
        <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${JOB_STATUS_STYLES[job.status]}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="text-[12.5px] text-muted-2">
            {job.scheduled_date} · {job.start_time?.slice(0, 5) ?? "—"}
            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
          </div>
          {job.description && <div className="mt-2 text-[13px] text-[#344054]">{job.description}</div>}
          {job.locations?.address && (
            <div className="mt-2 text-[12.5px] text-muted">📍 {job.locations.address}</div>
          )}
          {job.clients?.phone && (
            <a href={`tel:${job.clients.phone}`} className="mt-1 block text-[12.5px] font-semibold text-electric">
              📞 {job.clients.phone}
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {isTraveling && (
            <>
              {maps && (
                <a
                  href={maps}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[12px] border border-[#d0d5dd] bg-white py-3.5 text-center text-[14px] font-bold text-[#344054]"
                >
                  Deschide în Hărți
                </a>
              )}
              {job.status === "programata" ? (
                <StartTravelButton
                  jobId={job.id}
                  jobTitle={job.title}
                  address={job.locations?.address ?? null}
                />
              ) : (
                <ArriveButton jobId={job.id} />
              )}
            </>
          )}

          {job.status === "ajunsa" && (
            <>
              <div className="rounded-[12px] border border-success-bg bg-success-bg p-4 text-center">
                <div className="text-[13.5px] font-bold text-success">✓ Ai ajuns la locație</div>
                {job.arrived_at && (
                  <div className="mt-1 text-[12px] text-success">
                    {new Date(job.arrived_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              <Link
                href={`/mobil/lucrari/${job.id}/checklist`}
                className="flex items-center gap-3 rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-electric-soft">
                  <ClipboardList className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
                </div>
                <div className="flex-1 text-[13.5px] font-bold">Checklist înainte de start</div>
                <ChevronRight className="h-4 w-4 text-muted-2" />
              </Link>
              <form action={startWork.bind(null, job.id)}>
                <button
                  type="submit"
                  className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
                >
                  PORNEȘTE LUCRUL
                </button>
              </form>
            </>
          )}

          {isWorking && (
            <>
              <Link
                href={`/mobil/lucrari/${job.id}/foto`}
                className="block rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
              >
                CONTINUĂ LUCRAREA
              </Link>
              <div className="text-center text-[12px] text-muted-2">
                Fotografii ({photoCount ?? 0}) → Finalizare → Semnătură
                {expenseCount ? ` · ${expenseCount} cheltuieli adăugate` : ""}
              </div>
            </>
          )}

          {isDone && (
            <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
              <div className="text-[13.5px] font-bold text-success">✓ Lucrare finalizată</div>
              {job.work_ended_at && (
                <div className="mt-1 text-[12px] text-muted-2">
                  Finalizată {new Date(job.work_ended_at).toLocaleString("ro-RO")}
                </div>
              )}
              {job.observations && <div className="mt-2 text-[13px] text-[#344054]">{job.observations}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


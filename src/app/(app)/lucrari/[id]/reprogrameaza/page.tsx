import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadDurationStats } from "@/lib/job-durations-server";
import { RESCHEDULE_REASONS, longDate } from "@/lib/service-requests";
import { RescheduleForm } from "./reschedule-form";

/** Reprogramare cu motiv: lucrarea se mută, echipa e anunțată, iar biroul primește mesajul pentru client. */
export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const [{ data: job }, { data: history }, durations] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, display_number, title, status, team_id, domain, scheduled_date, start_time, end_time, clients(name)")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase.from("job_reschedules").select("from_date, to_date, reason, note, created_at").eq("job_id", id).order("created_at", { ascending: false }).limit(10),
    loadDurationStats(supabase, organization.id),
  ]);
  if (!job) notFound();
  const closed = job.status === "finalizata" || job.status === "anulata";

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 p-7">
      <div className="flex items-center gap-2.5">
        <Link href={`/lucrari/${id}`} className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-neutral-bg" aria-label="Înapoi la lucrare">
          <ArrowLeft className="h-[15px] w-[15px] text-[#344054]" />
        </Link>
        <div>
          <h1 className="text-[19px] font-extrabold text-foreground">Reprogramează lucrarea #{job.display_number}</h1>
          <p className="text-[13px] text-muted">
            {job.title}
            {job.clients?.name ? ` · ${job.clients.name}` : ""} · acum: {longDate(job.scheduled_date)}
            {job.start_time ? `, ${job.start_time.slice(0, 5)}` : ""}
          </p>
        </div>
      </div>

      {closed ? (
        <p className="rounded-[12px] border border-border bg-white p-4 text-[13.5px] text-muted">Lucrarea e deja încheiată și nu se mai poate reprograma.</p>
      ) : (
        <RescheduleForm
          jobId={id}
          title={job.title}
          teamId={job.team_id}
          domain={job.domain}
          current={{ date: job.scheduled_date, start: job.start_time?.slice(0, 5) ?? "", end: job.end_time?.slice(0, 5) ?? "" }}
          durations={durations}
        />
      )}

      {(history ?? []).length > 0 && (
        <section className="rounded-[12px] border border-border bg-white p-4">
          <div className="mb-2 text-[13.5px] font-bold">Reprogramări anterioare</div>
          <ul className="flex flex-col gap-1.5 text-[13px] text-[#475467]">
            {(history ?? []).map((h, i) => (
              <li key={i}>
                {h.from_date ? `${longDate(h.from_date)} → ` : ""}{longDate(h.to_date)} · {RESCHEDULE_REASONS.find((r) => r.id === h.reason)?.label}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES, JOB_TYPE_LABELS } from "@/lib/status";
import { Briefcase, Plus } from "lucide-react";

export default async function LucrariPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, display_number, title, job_type, status, scheduled_date, start_time, end_time, clients(name), locations(address), teams(name)"
    )
    .eq("organization_id", organization.id)
    .order("scheduled_date", { ascending: false })
    .order("start_time", { ascending: true, nullsFirst: true });

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-extrabold text-foreground">Lucrări</h1>
        <Link
          href="/lucrari/nou"
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Lucrare nouă
        </Link>
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
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5">
                    <Link href={`/lucrari/${job.id}`} className="text-[13px] font-bold text-electric">
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
                    {job.teams?.name ?? "neasignată"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                    {job.scheduled_date}
                    {job.start_time ? ` · ${job.start_time.slice(0, 5)}` : ""}
                    {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={JOB_STATUS_LABELS[job.status]}
                      className={JOB_STATUS_STYLES[job.status]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="Nicio lucrare încă"
          description="Creează prima lucrare pentru a începe să urmărești programările echipei."
          action={
            <Link
              href="/lucrari/nou"
              className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Lucrare nouă
            </Link>
          }
        />
      )}
    </div>
  );
}

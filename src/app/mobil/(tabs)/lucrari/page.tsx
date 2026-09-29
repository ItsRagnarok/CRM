import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { Briefcase } from "lucide-react";
import { todayInOrgTimeZone } from "@/lib/date";

type Range = "azi" | "saptamana" | "toate";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}
function startOfWeek(d: Date) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export default async function MobileJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: Range = rawRange === "saptamana" ? "saptamana" : rawRange === "toate" ? "toate" : "azi";
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const todayStr = todayInOrgTimeZone();
  const today = new Date(`${todayStr}T00:00:00Z`);
  const weekStartStr = toISODate(startOfWeek(today));
  const weekEndStr = toISODate(addDays(startOfWeek(today), 6));

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, scheduled_date, start_time, end_time, clients(name), locations(address))"
    )
    .eq("profile_id", profile.id);

  let jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  if (range === "azi") {
    jobs = jobs.filter((j) => j.scheduled_date === todayStr);
  } else if (range === "saptamana") {
    jobs = jobs.filter((j) => j.scheduled_date >= weekStartStr && j.scheduled_date <= weekEndStr);
  }

  jobs.sort(
    (a, b) => b.scheduled_date.localeCompare(a.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")
  );

  const groups = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!groups.has(job.scheduled_date)) groups.set(job.scheduled_date, []);
    groups.get(job.scheduled_date)!.push(job);
  }

  const rangeHref = (r: Range) => (r === "azi" ? "/mobil/lucrari" : `/mobil/lucrari?range=${r}`);

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3.5 pt-1.5">
        <div className="text-[19px] font-extrabold">Lucrările mele</div>
        <div className="mt-3.5 flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          {(["azi", "saptamana", "toate"] as Range[]).map((r) => (
            <Link
              key={r}
              href={rangeHref(r)}
              className={`flex-1 rounded-[7px] py-1.5 text-center text-[12px] ${
                range === r ? "bg-white font-bold shadow-sm" : "font-semibold text-muted"
              }`}
            >
              {r === "azi" ? "Astăzi" : r === "saptamana" ? "Săptămâna" : "Toate"}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col px-4 py-4">
        {groups.size === 0 ? (
          <EmptyState icon={Briefcase} title="Nicio lucrare" description="Nu ai lucrări în această perioadă." />
        ) : (
          [...groups.entries()].map(([date, dayJobs]) => (
            <div key={date} className="mb-[18px]">
              <div className="mb-2 text-[11.5px] font-bold text-muted-2">
                {date === todayStr ? "ASTĂZI" : ""}
                {" · "}
                {new Date(`${date}T00:00:00`)
                  .toLocaleDateString("ro-RO", { day: "numeric", month: "long" })
                  .toUpperCase()}
              </div>
              <div className="flex flex-col gap-2.5">
                {dayJobs.map((job) => {
                  const isActive = job.status === "in_lucru" || job.status === "pauza";
                  const isDone = job.status === "finalizata";
                  return (
                    <Link
                      key={job.id}
                      href={`/mobil/lucrari/${job.id}`}
                      className={`block rounded-[14px] bg-white p-3.5 ${
                        isActive ? "border-[1.5px] border-electric" : "border border-[#eaecf0]"
                      } ${isDone ? "opacity-85" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[12.5px] font-extrabold text-[#344054]">
                          {job.start_time?.slice(0, 5) ?? "—"}
                          {job.end_time ? ` – ${job.end_time.slice(0, 5)}` : ""}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${JOB_STATUS_STYLES[job.status]}`}
                        >
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[14.5px] font-extrabold">{job.clients?.name ?? "Client"}</div>
                      <div className="mt-0.5 text-[12.5px] text-[#475467]">
                        {job.title}
                        {job.locations?.address ? ` · ${job.locations.address}` : ""}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

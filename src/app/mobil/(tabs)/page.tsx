import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { CalendarCheck } from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}

function mapsHref(address: string | null, lat: number | null, lng: number | null) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return null;
}

export default async function MobileHomePage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const firstName = profile.full_name.split(" ")[0];
  const today = new Date().toISOString().slice(0, 10);

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, scheduled_date, start_time, end_time, clients(name), locations(address, lat, lng))"
    )
    .eq("profile_id", profile.id);

  const jobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j) && j!.scheduled_date === today)
    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  const color = avatarColor(profile.id);

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3.5 pt-1.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[19px] font-extrabold">{greeting()}, {firstName} 👋</div>
            <div className="mt-0.5 text-[13px] text-muted">
              {jobs.length > 0 ? `Ai ${jobs.length} lucrări astăzi.` : "Nicio lucrare programată azi."}
            </div>
          </div>
          <div
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: color.bg, color: color.text }}
          >
            {initials(profile.full_name)}
          </div>
        </div>
        <div className="mt-3.5 flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <div className="flex-1 rounded-[7px] bg-white py-1.5 text-center text-[12.5px] font-bold shadow-sm">
            Astăzi
          </div>
          <Link
            href="/mobil/lucrari"
            className="flex-1 rounded-[7px] py-1.5 text-center text-[12.5px] font-semibold text-muted"
          >
            Calendar
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {jobs.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nicio lucrare azi"
            description="Bucură-te de zi — nu ai nimic programat."
          />
        ) : (
          jobs.map((job) => {
            const isActive = job.status === "in_lucru" || job.status === "pauza";
            const maps = mapsHref(job.locations?.address ?? null, job.locations?.lat ?? null, job.locations?.lng ?? null);
            return (
              <div
                key={job.id}
                className={`rounded-[14px] bg-white p-4 ${
                  isActive
                    ? "border-[1.5px] border-electric shadow-[0_4px_14px_rgba(47,111,237,0.12)]"
                    : "border border-[#eaecf0]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-[13px] font-extrabold ${isActive ? "text-electric" : "text-[#344054]"}`}>
                    {job.start_time?.slice(0, 5) ?? "—"}
                    {job.end_time ? ` – ${job.end_time.slice(0, 5)}` : ""}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${JOB_STATUS_STYLES[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
                <div className="mt-2 text-[15.5px] font-extrabold">{job.clients?.name ?? "Client"}</div>
                <div className="mt-0.5 text-[13px] text-[#475467]">{job.title}</div>
                {job.locations?.address && (
                  <div className="mt-2 text-[12.5px] text-muted">📍 {job.locations.address}</div>
                )}
                <div className="mt-3.5 flex gap-2.5">
                  {maps ? (
                    <a
                      href={maps}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-[10px] bg-electric py-3 text-center text-[13.5px] font-bold text-white"
                    >
                      NAVIGARE
                    </a>
                  ) : (
                    <div className="flex-1 rounded-[10px] bg-neutral-bg py-3 text-center text-[13.5px] font-bold text-muted-2">
                      NAVIGARE
                    </div>
                  )}
                  <Link
                    href={`/mobil/lucrari/${job.id}`}
                    className="flex-1 rounded-[10px] bg-neutral-bg py-3 text-center text-[13.5px] font-bold text-[#344054]"
                  >
                    DETALII
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

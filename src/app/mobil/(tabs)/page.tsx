import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avatarColor, initials } from "@/lib/avatar-color";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { DepartureAlert } from "./departure-alert";
import { ArrivalAlert } from "./arrival-alert";

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

const WEEKDAYS = ["L", "Ma", "Mi", "J", "V", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function MobileHomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; date?: string }>;
}) {
  const { view: rawView, month: rawMonth, date: rawDate } = await searchParams;
  const view = rawView === "calendar" ? "calendar" : "astazi";
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const firstName = profile.full_name.split(" ")[0];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, scheduled_date, start_time, end_time, clients(name), locations(address, lat, lng))"
    )
    .eq("profile_id", profile.id);

  const allJobs = (assignments ?? [])
    .map((a) => a.jobs)
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  const color = avatarColor(profile.id);

  if (view === "calendar") {
    const monthStr = rawMonth && /^\d{4}-\d{2}$/.test(rawMonth) ? rawMonth : today.slice(0, 7);
    const [y, m] = monthStr.split("-").map(Number);
    const selectedDate = rawDate && rawDate.slice(0, 7) === monthStr ? rawDate : monthStr === today.slice(0, 7) ? today : `${monthStr}-01`;

    const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const leadingBlank = (firstOfMonth.getUTCDay() + 6) % 7; // Monday = 0

    const jobCountByDate = new Map<string, number>();
    for (const j of allJobs) {
      jobCountByDate.set(j.scheduled_date, (jobCountByDate.get(j.scheduled_date) ?? 0) + 1);
    }

    const prevMonthDate = new Date(Date.UTC(y, m - 2, 1));
    const nextMonthDate = new Date(Date.UTC(y, m, 1));
    const prevMonthStr = `${prevMonthDate.getUTCFullYear()}-${pad(prevMonthDate.getUTCMonth() + 1)}`;
    const nextMonthStr = `${nextMonthDate.getUTCFullYear()}-${pad(nextMonthDate.getUTCMonth() + 1)}`;

    const monthLabel = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" }).format(firstOfMonth);

    const dayJobs = allJobs
      .filter((j) => j.scheduled_date === selectedDate)
      .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));

    const cells: (number | null)[] = [
      ...Array(leadingBlank).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <div className="flex flex-col">
        <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3.5 pt-1.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[19px] font-extrabold">{greeting()}, {firstName} 👋</div>
              <div className="mt-0.5 text-[13px] text-muted">Calendarul lucrărilor tale</div>
            </div>
            <div
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
              style={{ background: color.bg, color: color.text }}
            >
              {initials(profile.full_name)}
            </div>
          </div>
          <div className="mt-3.5 flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
            <Link href="/mobil" className="flex-1 rounded-[7px] py-1.5 text-center text-[12.5px] font-semibold text-muted">
              Astăzi
            </Link>
            <div className="flex-1 rounded-[7px] bg-white py-1.5 text-center text-[12.5px] font-bold shadow-sm">
              Calendar
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-[14px] border border-[#eaecf0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <Link
                href={`/mobil?view=calendar&month=${prevMonthStr}`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-bg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <div className="text-[14.5px] font-extrabold capitalize">{monthLabel}</div>
              <Link
                href={`/mobil?view=calendar&month=${nextMonthStr}`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-bg"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-[10.5px] font-bold text-muted-2">
                  {w}
                </div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={`b${i}`} />;
                const dateStr = `${monthStr}-${pad(day)}`;
                const count = jobCountByDate.get(dateStr) ?? 0;
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <Link
                    key={dateStr}
                    href={`/mobil?view=calendar&month=${monthStr}&date=${dateStr}`}
                    className={`flex flex-col items-center gap-0.5 rounded-[9px] py-1.5 text-[12.5px] font-semibold ${
                      isSelected
                        ? "bg-electric text-white"
                        : isToday
                        ? "border border-electric text-electric"
                        : "text-[#344054]"
                    }`}
                  >
                    {day}
                    <span
                      className={`h-1 w-1 rounded-full ${
                        count > 0 ? (isSelected ? "bg-white" : "bg-electric") : "bg-transparent"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <div className="text-[11.5px] font-bold text-muted-2">
              {new Date(`${selectedDate}T00:00:00`)
                .toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })
                .toUpperCase()}
            </div>
            {dayJobs.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Nicio lucrare" description="Nu ai lucrări programate în această zi." />
            ) : (
              dayJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/mobil/lucrari/${job.id}`}
                  className="block rounded-[14px] border border-[#eaecf0] bg-white p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[12.5px] font-extrabold text-[#344054]">
                      {job.start_time?.slice(0, 5) ?? "—"}
                      {job.end_time ? ` – ${job.end_time.slice(0, 5)}` : ""}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${JOB_STATUS_STYLES[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[14.5px] font-extrabold">{job.clients?.name ?? "Client"}</div>
                  <div className="mt-0.5 text-[12.5px] text-[#475467]">
                    {job.title}
                    {job.locations?.address ? ` · ${job.locations.address}` : ""}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const jobs = allJobs
    .filter((j) => j.scheduled_date === today)
    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  const nextUpcomingJob = jobs.find(
    (j) => j.status === "programata" && j.start_time && j.locations?.lat != null && j.locations?.lng != null
  );

  const inDrumJob = allJobs.find(
    (j) => j.status === "in_drum" && j.locations?.lat != null && j.locations?.lng != null
  );
  const { data: arrivalPrompt } = inDrumJob
    ? await supabase.from("arrival_prompts").select("attempts").eq("job_id", inDrumJob.id).maybeSingle()
    : { data: null };

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
            href="/mobil?view=calendar"
            className="flex-1 rounded-[7px] py-1.5 text-center text-[12.5px] font-semibold text-muted"
          >
            Calendar
          </Link>
        </div>
      </div>

      {nextUpcomingJob && nextUpcomingJob.locations && (
        <DepartureAlert
          job={{
            id: nextUpcomingJob.id,
            title: nextUpcomingJob.title,
            scheduled_date: nextUpcomingJob.scheduled_date,
            start_time: nextUpcomingJob.start_time!,
            lat: nextUpcomingJob.locations.lat,
            lng: nextUpcomingJob.locations.lng,
            address: nextUpcomingJob.locations.address,
          }}
        />
      )}

      {inDrumJob && inDrumJob.locations?.lat != null && inDrumJob.locations?.lng != null && (
        <ArrivalAlert
          job={{
            id: inDrumJob.id,
            title: inDrumJob.title,
            lat: inDrumJob.locations.lat,
            lng: inDrumJob.locations.lng,
          }}
          initialAttempts={arrivalPrompt?.attempts ?? 0}
        />
      )}

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

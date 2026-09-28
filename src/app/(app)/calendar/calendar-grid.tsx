"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { rescheduleJob } from "./actions";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  JOB_STATUS_MARKER_COLOR,
} from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];

type Job = {
  id: string;
  display_number: number;
  title: string;
  status: JobStatus;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  team_id: string | null;
  clients: { name: string } | null;
  job_assignments: { profiles: { full_name: string } | null }[];
};

type Day = { dateStr: string; dayNum: number; isToday: boolean };

const DAY_NAMES = ["DUMINICĂ", "LUNI", "MARȚI", "MIERCURI", "JOI", "VINERI", "SÂMBĂTĂ"];
const MONTHS = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

const HOUR_START = 7;
const HOUR_END = 19;
const PX_PER_HOUR = 50;

function dateParts(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), weekday: d.getUTCDay() };
}

function rangeLabel(days: Day[]) {
  const first = dateParts(days[0].dateStr);
  const last = dateParts(days[days.length - 1].dateStr);
  if (days.length === 1) {
    return `${DAY_NAMES[first.weekday]}, ${first.day} ${MONTHS[first.month]} ${first.year}`;
  }
  if (first.month === last.month && first.year === last.year) {
    return `${first.day}–${last.day} ${MONTHS[first.month]} ${first.year}`;
  }
  return `${first.day} ${MONTHS[first.month]} – ${last.day} ${MONTHS[last.month]} ${last.year}`;
}

function timeToHours(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

export function CalendarGrid({
  view,
  days,
  jobs,
  teams,
  selectedTeamId,
  anchorStr,
  prevStr,
  nextStr,
  todayStr,
}: {
  view: "day" | "week";
  days: Day[];
  jobs: Job[];
  teams: { id: string; name: string }[];
  selectedTeamId: string;
  anchorStr: string;
  prevStr: string;
  nextStr: string;
  todayStr: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const baseHref = (overrides: { date?: string; view?: string; teamId?: string }) => {
    const params = new URLSearchParams();
    params.set("date", overrides.date ?? anchorStr);
    params.set("view", overrides.view ?? view);
    const t = overrides.teamId ?? selectedTeamId;
    if (t) params.set("teamId", t);
    return `/calendar?${params.toString()}`;
  };

  const jobsByDay = new Map<string, Job[]>();
  for (const job of jobs) {
    (jobsByDay.get(job.scheduled_date) ?? jobsByDay.set(job.scheduled_date, []).get(job.scheduled_date)!).push(job);
  }

  function handleDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDragOverDate(null);
    const jobId = e.dataTransfer.getData("text/job-id");
    const fromDate = e.dataTransfer.getData("text/job-date");
    if (!jobId || fromDate === dateStr) return;
    startTransition(async () => {
      await rescheduleJob(jobId, dateStr);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[66px] shrink-0 items-center gap-3.5 border-b border-border bg-white px-6">
        <div className="text-[17px] font-extrabold text-foreground">Calendar</div>

        <div className="ml-2 flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <Link
            href={baseHref({ view: "day" })}
            prefetch={false}
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold ${
              view === "day" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Zi
          </Link>
          <Link
            href={baseHref({ view: "week" })}
            prefetch={false}
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold ${
              view === "week" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Săptămână
          </Link>
          <span
            title="În curând"
            className="cursor-not-allowed rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold text-muted-2"
          >
            Lună
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={baseHref({ date: prevStr })}
            prefetch={false}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:bg-neutral-bg"
            aria-label="Perioada anterioară"
          >
            ‹
          </Link>
          <Link
            href={baseHref({ date: todayStr })}
            prefetch={false}
            className="rounded-[8px] px-2.5 py-1.5 text-[12px] font-bold text-muted hover:bg-neutral-bg"
          >
            Azi
          </Link>
          <Link
            href={baseHref({ date: nextStr })}
            prefetch={false}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:bg-neutral-bg"
            aria-label="Perioada următoare"
          >
            ›
          </Link>
        </div>

        <div className="ml-1 text-[14px] font-bold text-foreground">{rangeLabel(days)}</div>

        <div className="flex-1" />

        <select
          value={selectedTeamId}
          onChange={(e) => router.push(baseHref({ teamId: e.target.value }))}
          className="rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[12.5px] font-bold text-[#344054] outline-none"
        >
          <option value="">Filtre: Toate echipele</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <Link
          href={`/lucrari/nou?date=${anchorStr}`}
          prefetch={false}
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Lucrare nouă
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="min-w-[1180px] overflow-hidden rounded-[13px] border border-border bg-white">
          <div
            className="grid border-b border-border"
            style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}
          >
            <div />
            {days.map((d) => (
              <div key={d.dateStr} className="border-l border-[#f2f4f7] px-2.5 py-2.5 text-center">
                <div className="text-[11px] font-bold text-muted-2">
                  {DAY_NAMES[dateParts(d.dateStr).weekday]}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[14px] font-bold ${
                    d.isToday ? "bg-electric text-white" : "text-foreground"
                  }`}
                >
                  {d.dayNum}
                </div>
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
            <div className="relative" style={{ height: (HOUR_END - HOUR_START) * PX_PER_HOUR }}>
              {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
                .filter((h) => h % 2 === HOUR_START % 2)
                .map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-2"
                    style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
            </div>

            {days.map((d) => {
              const dayJobs = jobsByDay.get(d.dateStr) ?? [];
              const timedJobs = dayJobs.filter((j) => j.start_time);
              const untimedJobs = dayJobs.filter((j) => !j.start_time);

              return (
                <div
                  key={d.dateStr}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(d.dateStr);
                  }}
                  onDragLeave={() => setDragOverDate((cur) => (cur === d.dateStr ? null : cur))}
                  onDrop={(e) => handleDrop(e, d.dateStr)}
                  className={`relative border-l ${
                    dragOverDate === d.dateStr ? "border-electric bg-electric-soft" : "border-[#f2f4f7]"
                  }`}
                  style={{
                    height: (HOUR_END - HOUR_START) * PX_PER_HOUR,
                    backgroundImage:
                      dragOverDate === d.dateStr
                        ? undefined
                        : `repeating-linear-gradient(180deg, transparent, transparent ${PX_PER_HOUR - 1}px, #f2f4f7 ${PX_PER_HOUR}px)`,
                  }}
                >
                  {untimedJobs.length > 0 && (
                    <div className="absolute inset-x-1 top-1 z-10 flex flex-col gap-1">
                      {untimedJobs.map((job) => (
                        <JobCard key={job.id} job={job} dateStr={d.dateStr} compact />
                      ))}
                    </div>
                  )}

                  {timedJobs.map((job) => {
                    const start = timeToHours(job.start_time) ?? HOUR_START;
                    const end = timeToHours(job.end_time) ?? start + 1;
                    const top = Math.max(0, (start - HOUR_START) * PX_PER_HOUR);
                    const height = Math.max((end - start) * PX_PER_HOUR, 32);
                    return (
                      <div key={job.id} className="absolute inset-x-1" style={{ top, height }}>
                        <JobCard job={job} dateStr={d.dateStr} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, dateStr, compact }: { job: Job; dateStr: string; compact?: boolean }) {
  const assignees = job.job_assignments
    .map((a) => a.profiles?.full_name)
    .filter((n): n is string => Boolean(n));
  const color = JOB_STATUS_MARKER_COLOR[job.status];

  return (
    <Link
      href={`/lucrari/${job.id}`}
      prefetch={false}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/job-id", job.id);
        e.dataTransfer.setData("text/job-date", dateStr);
      }}
      className={`block h-full overflow-hidden rounded-[7px] border-l-[3px] px-2.5 py-1.5 ${JOB_STATUS_STYLES[job.status]}`}
      style={{ borderLeftColor: color }}
      title={`${job.title} — ${JOB_STATUS_LABELS[job.status]}`}
    >
      {!compact && job.start_time && (
        <div className="text-[11px] font-bold" style={{ color }}>
          {job.start_time.slice(0, 5)}
          {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
        </div>
      )}
      <div className="truncate text-[12px] font-bold text-foreground">
        {job.clients?.name ?? job.title}
      </div>
      {!compact && (
        <div className="truncate text-[10.5px] text-[#475467]">
          {job.title}
          {assignees.length > 0 ? ` · ${assignees.join("+")}` : ""}
        </div>
      )}
    </Link>
  );
}

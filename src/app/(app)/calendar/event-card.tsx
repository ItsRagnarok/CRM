"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Briefcase,
  ClipboardCheck,
  Clock3,
  Gauge,
  Plug,
  Settings2,
  Sun,
  Wrench,
} from "lucide-react";
import { JOB_STATUS_LABELS, JOB_STATUS_MARKER_COLOR } from "@/lib/status";
import type { WeekJob } from "@/lib/team-week";
import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];

/** Iconița spune din prima privire ce fel de lucrare e; o alegem după cuvintele din titlu, apoi după domeniu. */
function iconFor(job: WeekJob) {
  const t = job.title.toLowerCase();
  if (/revizi|repara|depanar|interven/.test(t)) return Wrench;
  if (/verific|inspec|control|pram|măsur|masur/.test(t)) return ClipboardCheck;
  if (/înlocu|inlocu|mutare|schimb/.test(t)) return ArrowLeftRight;
  if (/prob|recep|punere în func|pif/.test(t)) return Gauge;
  if (/montaj|instal|racord|execu/.test(t)) return Settings2;
  if (job.domain === "fotovoltaic") return Sun;
  if (job.domain === "electric") return Plug;
  return Briefcase;
}

export function eventClass(job: Pick<WeekJob, "domain">, conflict: boolean) {
  if (conflict) return "ef-ev ef-ev-conflict";
  return `ef-ev ${job.domain === "gaze" || job.domain === "electric" || job.domain === "fotovoltaic" ? `ef-ev-${job.domain}` : ""}`;
}

export function EventCard({
  job,
  conflict,
  dense = false,
  fill = false,
  dragDate,
  tight = false,
}: {
  job: WeekJob;
  conflict: boolean;
  /** Varianta strânsă din grila pe ore: titlul pe un rând. */
  dense?: boolean;
  /** Umple înălțimea dată de grila pe ore. */
  fill?: boolean;
  /** Dacă e dată, cardul se poate trage pe altă zi. */
  dragDate?: string;
  /** Coloană îngustă sau lucrare scurtă: fără iconiță și fără client, doar titlul și ora. */
  tight?: boolean;
}) {
  const Icon = conflict ? AlertTriangle : iconFor(job);
  const status = job.status as JobStatus;
  const time = job.start_time ? `${job.start_time.slice(0, 5)}${dense && job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}` : null;
  const people = job.assignees.map((a) => a.name.split(" ")[0]).filter(Boolean).join(", ");

  return (
    <Link
      href={`/lucrari/${job.id}`}
      prefetch={false}
      draggable={Boolean(dragDate)}
      onDragStart={dragDate ? (e) => {
        e.dataTransfer.setData("text/job-id", job.id);
        e.dataTransfer.setData("text/job-date", dragDate);
      } : undefined}
      title={`#${job.display_number} ${job.title} · ${JOB_STATUS_LABELS[status] ?? job.status}${people ? ` · ${people}` : ""}`}
      className={`${eventClass(job, conflict)} flex gap-2 overflow-hidden rounded-[10px] ${tight ? "px-2 py-1.5" : "px-2.5 py-2"} leading-snug text-foreground transition ${fill ? "h-full" : ""}`}
    >
      {!tight && <Icon className="ef-ev-ink mt-[1px] h-[15px] w-[15px] shrink-0" strokeWidth={2} />}
      <div className="min-w-0 flex-1">
        <div className={`text-[12px] font-bold ${dense ? "truncate" : "line-clamp-2"}`}>
          {conflict ? "Suprapunere · " : ""}{job.title}
        </div>
        {!tight && job.clients?.name && <div className="truncate text-[11px] text-[#475467]">{job.clients.name}</div>}
        <div className={`${tight ? "mt-0.5" : "mt-1"} flex items-center gap-1.5 text-[11px] font-bold`}>
          {time && (
            <span className="inline-flex items-center gap-1">
              {!tight && <Clock3 className="h-3 w-3" strokeWidth={2.2} />} {time}
            </span>
          )}
          <span
            className="ml-auto h-2 w-2 shrink-0 rounded-full"
            style={{ background: JOB_STATUS_MARKER_COLOR[status] ?? "#98a2b3" }}
            aria-label={JOB_STATUS_LABELS[status] ?? job.status}
          />
        </div>
      </div>
    </Link>
  );
}

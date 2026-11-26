"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { WarningList } from "@/components/schedule-warnings";
import type { ScheduleWarning } from "@/lib/schedule-warnings";
import type { WeekJob } from "@/lib/team-week";
import { rescheduleJob } from "./actions";
import { EventCard } from "./event-card";

const HOUR_START = 7;
const HOUR_END = 19;
const PX_PER_HOUR = 56;
const GRID_HEIGHT = (HOUR_END - HOUR_START) * PX_PER_HOUR;

export type GridColumn = {
  key: string;
  /** Ziua coloanei (în vederea Zi toate coloanele au aceeași zi). */
  dateStr: string;
  head: React.ReactNode;
  jobs: WeekJob[];
  leaves: string[];
  highlight?: boolean;
};

function timeToHours(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

// Lucrările care se suprapun în timp se pun una lângă alta, nu una peste alta.
type Positioned = { job: WeekJob; top: number; height: number; col: number; cols: number };

function layoutTimedJobs(jobs: WeekJob[]): Positioned[] {
  const items = jobs
    .map((job) => {
      const rawStart = timeToHours(job.start_time) ?? HOUR_START;
      const rawEnd = Math.max(timeToHours(job.end_time) ?? rawStart + 1, rawStart + 0.5);
      const start = Math.min(Math.max(rawStart, HOUR_START), HOUR_END);
      const end = Math.min(Math.max(rawEnd, start + 0.25), HOUR_END);
      return { job, start, end };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters: (typeof items)[] = [];
  let current: typeof items = [];
  let currentEnd = -Infinity;
  for (const item of items) {
    if (current.length === 0 || item.start < currentEnd) {
      current.push(item);
      currentEnd = Math.max(currentEnd, item.end);
    } else {
      clusters.push(current);
      current = [item];
      currentEnd = item.end;
    }
  }
  if (current.length) clusters.push(current);

  const positioned: Positioned[] = [];
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const colOf: number[] = [];
    for (const item of cluster) {
      const c = columnEnds.findIndex((end) => end <= item.start);
      if (c >= 0) {
        columnEnds[c] = item.end;
        colOf.push(c);
      } else {
        columnEnds.push(item.end);
        colOf.push(columnEnds.length - 1);
      }
    }
    cluster.forEach((item, i) => {
      positioned.push({
        job: item.job,
        top: (item.start - HOUR_START) * PX_PER_HOUR,
        height: (item.end - item.start) * PX_PER_HOUR,
        col: colOf[i],
        cols: columnEnds.length,
      });
    });
  }
  return positioned;
}

/**
 * Grila pe ore. „Săptămână”: o coloană pe zi, lucrările se pot trage pe altă zi.
 * „Zi”: o coloană pe echipă, aceeași zi (fără tragere: mutarea între echipe se face din lucrare).
 */
export function CalendarGrid({
  columns,
  conflicts,
  draggable,
  firstHead,
}: {
  columns: GridColumn[];
  conflicts: string[];
  draggable: boolean;
  firstHead: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [moved, setMoved] = useState<{ id: string; label: string; warnings: ScheduleWarning[] } | null>(null);
  const conflictSet = new Set(conflicts);

  function handleDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDragOver(null);
    const jobId = e.dataTransfer.getData("text/job-id");
    const fromDate = e.dataTransfer.getData("text/job-date");
    if (!jobId || fromDate === dateStr) return;
    startTransition(async () => {
      const res = await rescheduleJob(jobId, dateStr);
      setMoved(res.warnings.length ? { id: jobId, label: res.label ?? "", warnings: res.warnings } : null);
      router.refresh();
    });
  }

  const template = `64px repeat(${columns.length}, minmax(150px, 1fr))`;

  return (
    <div className="relative">
      {moved && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(440px,calc(100vw-40px))] rounded-[14px] bg-white shadow-[0_18px_40px_rgba(16,24,40,.18)]">
          <div className="flex items-center justify-between px-4 pt-3 text-[13px] font-bold text-foreground">
            Lucrarea {moved.label} a fost mutată
            <button type="button" onClick={() => setMoved(null)} aria-label="Închide" className="rounded-md p-1 text-muted hover:bg-neutral-bg">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 pt-2">
            <WarningList warnings={moved.warnings} footer="Mutarea s-a salvat. Dacă nu e bine, trage lucrarea înapoi sau deschide-o și schimbă echipa." />
            <Link href={`/lucrari/${moved.id}/reprogrameaza`} className="mt-2 inline-block text-[12.5px] font-bold text-electric">Reprogramează cu motiv și mesaj pentru client →</Link>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(16,24,40,.04)]">
        <div style={{ minWidth: 64 + columns.length * 150 }}>
          <div className="grid border-b border-[#eaecf0]" style={{ gridTemplateColumns: template }}>
            <div className="flex items-end px-2 pb-2 text-[11px] font-bold text-muted-2">{firstHead}</div>
            {columns.map((c) => (
              <div key={c.key} className="border-l border-[#eaecf0]">{c.head}</div>
            ))}
          </div>

          {columns.some((c) => c.jobs.some((j) => !j.start_time) || c.leaves.length) && (
            <div className="grid border-b border-[#eaecf0]" style={{ gridTemplateColumns: template }}>
              <div className="px-2 py-2 text-[10.5px] font-bold leading-tight text-muted-2">fără oră</div>
              {columns.map((c) => (
                <div key={c.key} className="flex flex-col gap-1.5 border-l border-[#eaecf0] p-1.5">
                  {c.jobs.filter((j) => !j.start_time).map((j) => (
                    <EventCard key={j.id} job={j} conflict={conflictSet.has(j.id)} dense dragDate={draggable ? c.dateStr : undefined} />
                  ))}
                  {c.leaves.map((name) => (
                    <div key={name} className="ef-ev ef-ev-leave rounded-[10px] px-2.5 py-1.5 text-[11.5px] text-foreground"><b>Concediu</b> · {name}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: template }}>
            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i).map((h) => (
                <div key={h} className="absolute right-2 text-[11px] font-semibold tabular-nums text-muted-2" style={{ top: (h - HOUR_START) * PX_PER_HOUR + 4 }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {columns.map((c) => {
              const timed = layoutTimedJobs(c.jobs.filter((j) => j.start_time));
              const over = dragOver === c.key;
              return (
                <div
                  key={c.key}
                  onDragOver={draggable ? (e) => { e.preventDefault(); setDragOver(c.key); } : undefined}
                  onDragLeave={draggable ? () => setDragOver((cur) => (cur === c.key ? null : cur)) : undefined}
                  onDrop={draggable ? (e) => handleDrop(e, c.dateStr) : undefined}
                  className={`relative border-l border-[#eaecf0] ${over ? "ef-cal-today" : ""}`}
                  style={{
                    height: GRID_HEIGHT,
                    backgroundImage: `repeating-linear-gradient(180deg, transparent 0, transparent ${PX_PER_HOUR - 1}px, var(--color-border) ${PX_PER_HOUR - 1}px, var(--color-border) ${PX_PER_HOUR}px)`,
                    backgroundBlendMode: "normal",
                  }}
                >
                  {timed.map(({ job, top, height, col, cols }) => (
                    <div
                      key={job.id}
                      className="absolute p-[2px]"
                      style={{
                        top,
                        height: Math.max(height, 56),
                        left: `${(col / cols) * 100}%`,
                        width: `${100 / cols}%`,
                      }}
                    >
                      <EventCard job={job} conflict={conflictSet.has(job.id)} dense fill tight={cols > 1 || height < 80} dragDate={draggable ? c.dateStr : undefined} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

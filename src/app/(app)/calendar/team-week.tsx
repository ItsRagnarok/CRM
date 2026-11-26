import Link from "next/link";
import { Users } from "lucide-react";
import type { WeekJob } from "@/lib/team-week";
import { EventCard } from "./event-card";

export type CalTeam = { id: string; name: string; description: string | null; members: string[] };
export type CalLeave = { name: string; teamId: string | null; start: string; end: string };

const DOW = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const MONTH = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

export function DayHead({ dateStr, todayStr }: { dateStr: string; todayStr: string }) {
  const dt = new Date(`${dateStr}T12:00:00Z`);
  const today = dateStr === todayStr;
  return (
    <div className={`px-4 py-3 ${today ? "ef-cal-today" : ""}`}>
      <div className="text-[14px] font-extrabold text-foreground">
        {DOW[(dt.getUTCDay() + 6) % 7]} {dt.getUTCDate()}
        {today && <span className="ml-1.5 rounded-full bg-[#101828] px-1.5 py-[1px] align-middle text-[10px] font-bold text-white">azi</span>}
      </div>
      <div className="text-[12px] text-muted">{MONTH[dt.getUTCMonth()]}</div>
    </div>
  );
}

export function TeamLabel({ team }: { team: CalTeam }) {
  return (
    <div className="flex gap-3 px-4 py-4">
      <div className="ef-cal-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        <Users className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-extrabold leading-tight text-foreground">{team.name}</div>
        {team.description && <div className="text-[13px] font-bold leading-tight text-foreground">{team.description}</div>}
        {team.members.length > 0 && <div className="mt-1 text-[12px] leading-snug text-muted">{team.members.join(", ")}</div>}
      </div>
    </div>
  );
}

/** Vederea „Echipe”: un rând pe echipă, o coloană pe zi. Răspunde la „cine e unde și cine e liber”. */
export function TeamWeek({
  days,
  teams,
  jobs,
  conflicts,
  leaves,
  todayStr,
}: {
  days: string[];
  teams: CalTeam[];
  jobs: WeekJob[];
  conflicts: Set<string>;
  leaves: CalLeave[];
  todayStr: string;
}) {
  const loose = jobs.filter((j) => !j.team_id);
  const rows: CalTeam[] = [...teams, ...(loose.length ? [{ id: "", name: "Fără echipă", description: "Lucrări fără echipă alocată", members: [] }] : [])];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(16,24,40,.04)]">
      <div className="grid min-w-[980px]" style={{ gridTemplateColumns: `230px repeat(${days.length}, minmax(0,1fr))` }}>
        <div className="flex items-center justify-between border-b border-r border-[#eaecf0] px-4 py-3">
          <span className="text-[14px] font-extrabold text-foreground">Echipă</span>
          <Link href="/echipe" className="text-[11.5px] font-bold text-electric hover:underline">Gestionează</Link>
        </div>
        {days.map((d) => (
          <div key={d} className="border-b border-r border-[#eaecf0] last:border-r-0">
            <DayHead dateStr={d} todayStr={todayStr} />
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full px-4 py-12 text-center text-sm text-muted">
            Nicio echipă activă. <Link href="/echipe/noua" className="font-bold text-electric">Creează prima echipă</Link>.
          </div>
        )}
        {rows.map((t) => (
          <div key={t.id || "none"} className="contents">
            <div className="border-b border-r border-[#eaecf0]">
              <TeamLabel team={t} />
            </div>
            {days.map((d) => {
              const cell = jobs
                .filter((j) => (j.team_id ?? "") === t.id && j.scheduled_date === d)
                .sort((a, b) => (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));
              const off = leaves.filter((l) => (l.teamId ?? "") === t.id && l.start <= d && l.end >= d);
              return (
                <div key={d} className={`flex min-h-[120px] flex-col gap-2 border-b border-r border-[#eaecf0] p-2 last:border-r-0`}>
                  {cell.map((j) => <EventCard key={j.id} job={j} conflict={conflicts.has(j.id)} />)}
                  {off.map((l) => (
                    <div key={l.name} className="ef-ev ef-ev-leave rounded-[10px] px-2.5 py-2 text-[11.5px] text-foreground">
                      <b className="block text-[12px]">Concediu</b>{l.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

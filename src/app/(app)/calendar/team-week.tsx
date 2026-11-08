import Link from "next/link";
import { findConflicts, jobHours, type WeekJob } from "@/lib/team-week";
import { domainLabel } from "@/lib/domains";

type Props = {
  days: { dateStr: string }[];
  teams: { id: string; name: string; members: string[] }[];
  jobs: WeekJob[];
  leaves: { name: string; teamId: string | null; start: string; end: string }[];
  todayStr: string;
  hoursAvailable: number;
};

const DOW = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const EVENT: Record<string, string> = {
  gaze: "border-[#84a31f] bg-[rgba(198,255,74,.28)]",
  electric: "border-[#d97706] bg-[#fff1e0]",
  fotovoltaic: "border-[#2563eb] bg-[#e0f0ff]",
};

export function TeamWeek({ days, teams, jobs, leaves, todayStr, hoursAvailable }: Props) {
  const conflicts = findConflicts(jobs);
  const live = jobs.filter((j) => j.status !== "anulata");
  const hours = live.reduce((a, j) => a + jobHours(j), 0);
  const tomorrow = new Date(Date.parse(`${todayStr}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  const busyTomorrow = new Set(live.filter((j) => j.scheduled_date === tomorrow).map((j) => j.team_id));
  const freeTeams = teams.filter((t) => !busyTomorrow.has(t.id)).length;
  const loose = live.filter((j) => !j.team_id);
  const rows = [...teams, ...(loose.length ? [{ id: "", name: "Fără echipă", members: [] as string[] }] : [])];
  const leaveCount = leaves.length;
  const k = (l: string, n: string | number, s: string, cls = "border-border") => (
    <div className={`rounded-2xl border bg-white px-[18px] py-4 ${cls}`}><div className="text-[12.5px] font-semibold text-muted">{l}</div><div className="mt-1 text-[28px] font-extrabold leading-none tabular-nums">{n}</div><div className="mt-1.5 text-[12px] text-muted">{s}</div></div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {k("Echipe libere mâine", `${freeTeams} din ${teams.length}`, freeTeams ? "fără nicio lucrare programată" : "toate au lucrări")}
        {k("Suprapuneri", conflicts.size ? new Set([...conflicts]).size : 0, conflicts.size ? "tehnicieni alocați de două ori în aceeași zi" : "nicio suprapunere", conflicts.size ? "border-[#f5c27a] bg-[#fffaf0]" : "border-border")}
        {k("Ore planificate săptămâna asta", `${Math.round(hours)} h`, hoursAvailable ? `din ${Math.round(hoursAvailable)} h disponibile` : "orele se iau din ora de început și de sfârșit")}
        {k("Concedii în perioadă", leaveCount, leaveCount ? leaves.slice(0, 2).map((l) => l.name).join(", ") : "niciun concediu aprobat", leaveCount ? "border-[#f0a3a3] bg-[#fff5f5]" : "border-border")}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <div className="grid min-w-[900px]" style={{ gridTemplateColumns: `170px repeat(${days.length}, minmax(0,1fr))` }}>
          <div className="border-b border-r border-[#eef0f4] bg-[#f6f7fa] px-3 py-2.5 text-[12px] font-extrabold text-[#334155]">Echipă</div>
          {days.map((d) => {
            const dt = new Date(`${d.dateStr}T12:00:00Z`);
            return (
              <div key={d.dateStr} className={`border-b border-r border-[#eef0f4] px-3 py-2.5 text-[12px] font-extrabold last:border-r-0 ${d.dateStr === todayStr ? "bg-[rgba(198,255,74,.25)] text-[#1f2024]" : "bg-[#f6f7fa] text-[#334155]"}`}>
                {DOW[(dt.getUTCDay() + 6) % 7]} {dt.getUTCDate()}
              </div>
            );
          })}
          {rows.length === 0 && <div className="col-span-full px-4 py-10 text-center text-sm text-muted">Nicio echipă activă. Creează echipe din Setări → Echipe & vehicule.</div>}
          {rows.map((t) => (
            <div key={t.id || "none"} className="contents">
              <div className="border-b border-r border-[#eef0f4] bg-[#fafbfc] px-3 py-3">
                <div className="text-[13px] font-extrabold">{t.name}</div>
                {t.members.length > 0 && <div className="text-[11px] text-muted">{t.members.join(", ")}</div>}
              </div>
              {days.map((d) => {
                const cell = live.filter((j) => (j.team_id ?? "") === t.id && j.scheduled_date === d.dateStr).sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
                const off = leaves.filter((l) => (l.teamId ?? "") === t.id && l.start <= d.dateStr && l.end >= d.dateStr);
                return (
                  <div key={d.dateStr} className="min-h-[88px] border-b border-r border-[#eef0f4] p-1.5 last:border-r-0">
                    {cell.map((j) => (
                      <Link key={j.id} href={`/lucrari/${j.id}`} prefetch={false}
                        className={`mb-1.5 block rounded-lg border-l-[3px] px-2 py-1.5 text-[11.5px] leading-snug ${conflicts.has(j.id) ? "border-[#dc2626] bg-[#fde4e4]" : EVENT[j.domain ?? ""] ?? "border-[#94a3b8] bg-[#eceff4]"}`}>
                        <b className="block text-[12px]">{conflicts.has(j.id) ? "Suprapunere · " : ""}{j.title}</b>
                        <span className="text-[#475467]">{j.start_time ? `${j.start_time.slice(0, 5)} · ` : ""}{j.clients?.name ?? ""}</span>
                      </Link>
                    ))}
                    {off.map((l) => (
                      <div key={l.name} className="mb-1.5 rounded-lg border-l-[3px] border-[#94a3b8] bg-[#eceff4] px-2 py-1.5 text-[11.5px]"><b className="block text-[12px]">Concediu</b>{l.name}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">Culoare = domeniu: <b>lime</b> gaze, <b>portocaliu</b> electrice, <b>albastru</b> fotovoltaice, gri fără domeniu{" "}({["gaze", "electric", "fotovoltaic"].map(domainLabel).join(", ")}). Roșu = același tehnician alocat de două ori în aceeași zi sau în intervale care se suprapun.</p>
    </div>
  );
}

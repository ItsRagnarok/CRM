import Link from "next/link";
import { Clock, Download, CalendarOff } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { avatarColor, initials } from "@/lib/avatar-color";
import {
  type View,
  type TimeEntry,
  resolveRange,
  pairHours,
  dailyWorkedHours,
  regularAndOvertimeHours,
  OVERTIME_MULTIPLIER,
  formatHM,
  STATUS_BADGE,
  statusKind,
  bestTodayStatus,
} from "./lib";

export default async function PontajPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; calc?: string }>;
}) {
  const { view: rawView, date, calc: rawCalc } = await searchParams;
  const view: View = rawView === "zi" ? "zi" : "saptamana";
  const calc: "simplu" | "suplimentare" = rawCalc === "suplimentare" ? "suplimentare" : "simplu";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { todayStr, anchor, rangeStart, rangeEnd, rangeStartStr, rangeEndStr, rangeEndExclusiveStr } =
    resolveRange(view, date);

  const [{ data: profiles }, { data: entries }, { data: jobsInRange }, { data: jobsToday }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, hourly_rate")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .in("role", ["technician", "team_leader"])
        .order("full_name"),
      supabase
        .from("time_entries")
        .select("profile_id, job_id, event_type, occurred_at")
        .eq("organization_id", organization.id)
        .gte("occurred_at", `${rangeStartStr}T00:00:00`)
        .lt("occurred_at", `${rangeEndExclusiveStr}T00:00:00`),
      supabase
        .from("jobs")
        .select("id, job_assignments(profile_id)")
        .eq("organization_id", organization.id)
        .gte("scheduled_date", rangeStartStr)
        .lte("scheduled_date", rangeEndStr),
      supabase
        .from("jobs")
        .select("id, status, job_assignments(profile_id)")
        .eq("organization_id", organization.id)
        .eq("scheduled_date", todayStr),
    ]);

  const entriesByProfile = new Map<string, TimeEntry[]>();
  for (const e of entries ?? []) {
    if (!entriesByProfile.has(e.profile_id)) entriesByProfile.set(e.profile_id, []);
    entriesByProfile.get(e.profile_id)!.push(e);
  }

  const jobCountByProfile = new Map<string, Set<string>>();
  for (const job of jobsInRange ?? []) {
    for (const a of job.job_assignments) {
      if (!jobCountByProfile.has(a.profile_id)) jobCountByProfile.set(a.profile_id, new Set());
      jobCountByProfile.get(a.profile_id)!.add(job.id);
    }
  }

  const todayStatusByProfile = new Map<string, string>();
  for (const job of jobsToday ?? []) {
    for (const a of job.job_assignments) {
      const next = bestTodayStatus(todayStatusByProfile.get(a.profile_id), job.status);
      if (next) todayStatusByProfile.set(a.profile_id, next);
    }
  }

  const rows = (profiles ?? []).map((p) => {
    const pEntries = entriesByProfile.get(p.id) ?? [];
    const worked = pairHours(pEntries, "work_start", "work_end");
    const travel = pairHours(pEntries, "travel_start", "arrival");
    const brk = pairHours(pEntries, "break_start", "break_end");
    const jobCount = jobCountByProfile.get(p.id)?.size ?? 0;
    const kind = statusKind(todayStatusByProfile.get(p.id));

    const dailyHours = dailyWorkedHours(pEntries, "work_start", "work_end");
    const { regular, overtime } = regularAndOvertimeHours(dailyHours);
    const rate = p.hourly_rate;
    const salary =
      rate == null
        ? null
        : calc === "suplimentare"
          ? regular * rate + overtime * rate * OVERTIME_MULTIPLIER
          : worked * rate;

    return { profile: p, worked, travel, brk, jobCount, kind, regular, overtime, rate, salary };
  });

  const totalSalary = rows.reduce((s, r) => s + (r.salary ?? 0), 0);
  const missingRateCount = rows.filter((r) => r.rate == null).length;

  const calcHref = (c: "simplu" | "suplimentare") => {
    const params = new URLSearchParams();
    if (view !== "saptamana") params.set("view", view);
    if (date) params.set("date", date);
    if (c !== "simplu") params.set("calc", c);
    return params.toString() ? `/pontaj?${params}` : "/pontaj";
  };

  const totalWorked = rows.reduce((s, r) => s + r.worked, 0);
  const totalTravel = rows.reduce((s, r) => s + r.travel, 0);
  const totalBreak = rows.reduce((s, r) => s + r.brk, 0);

  const viewHref = (v: View) => {
    const params = new URLSearchParams();
    if (v !== "saptamana") params.set("view", v);
    if (date) params.set("date", date);
    return params.toString() ? `/pontaj?${params}` : "/pontaj";
  };

  const rangeLabel =
    view === "zi"
      ? new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(anchor)
      : `${rangeStart.getUTCDate()}–${rangeEnd.getUTCDate()} ${new Intl.DateTimeFormat("ro-RO", {
          month: "long",
          year: "numeric",
        }).format(rangeEnd)}`;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-extrabold text-foreground">Pontaj</h1>

        <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <Link
            href={viewHref("zi")}
            prefetch={false}
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold ${
              view === "zi" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Zi
          </Link>
          <Link
            href={viewHref("saptamana")}
            prefetch={false}
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold ${
              view === "saptamana" ? "bg-white text-foreground shadow-sm" : "text-muted"
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

        <div className="text-[14px] font-bold text-foreground">{rangeLabel}</div>

        <div className="flex-1" />

        <Link
          href="/pontaj/concedii"
          className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13px] font-bold text-[#344054]"
        >
          <CalendarOff className="h-3.5 w-3.5" /> Concedii & absențe
        </Link>

        <a
          href={`/pontaj/export?view=${view}&date=${date ?? todayStr}`}
          className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13px] font-bold text-[#344054]"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={`Ore lucrate (${view === "zi" ? "ziua" : "săptămâna"})`} value={formatHM(totalWorked)} />
        <StatCard label="Ore deplasare" value={formatHM(totalTravel)} />
        <StatCard label="Ore pauză" value={formatHM(totalBreak)} />
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">
            Pontaj pe angajat — {rangeLabel}
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Angajat</th>
                <th className="px-5 py-3">Ore lucrate</th>
                <th className="px-5 py-3">Ore deplasare</th>
                <th className="px-5 py-3">Ore pauză</th>
                <th className="px-5 py-3">Lucrări</th>
                <th className="px-5 py-3">Status azi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ profile, worked, travel, brk, jobCount, kind }) => {
                const color = avatarColor(profile.id);
                const badge = STATUS_BADGE[kind];
                return (
                  <tr key={profile.id} className="border-t border-[#f2f4f7]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {initials(profile.full_name)}
                        </div>
                        <span className="text-[13.5px] font-bold text-foreground">{profile.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-bold text-foreground">{formatHM(worked)}</td>
                    <td className="px-5 py-3 text-[13px] text-[#344054]">{formatHM(travel)}</td>
                    <td className="px-5 py-3 text-[13px] text-[#344054]">{formatHM(brk)}</td>
                    <td className="px-5 py-3 text-[13px] text-[#344054]">{jobCount}</td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="Niciun angajat activ"
          description="Adaugă membri în echipe pentru a urmări pontajul."
        />
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2f4f7] px-5 py-3.5">
            <div className="text-[14.5px] font-bold">Salarizare — {rangeLabel}</div>
            <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
              <Link
                href={calcHref("simplu")}
                prefetch={false}
                className={`rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold ${
                  calc === "simplu" ? "bg-white text-foreground shadow-sm" : "text-muted"
                }`}
              >
                Simplu (ore × tarif)
              </Link>
              <Link
                href={calcHref("suplimentare")}
                prefetch={false}
                className={`rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold ${
                  calc === "suplimentare" ? "bg-white text-foreground shadow-sm" : "text-muted"
                }`}
              >
                Cu spor ore suplimentare (×{OVERTIME_MULTIPLIER}, peste 8h/zi)
              </Link>
            </div>
          </div>

          {missingRateCount > 0 && (
            <div className="border-b border-[#f2f4f7] bg-warning-bg px-5 py-2.5 text-[12px] font-semibold text-[#7a5b0e]">
              {missingRateCount} {missingRateCount === 1 ? "angajat nu are" : "angajați nu au"} tarif orar setat —
              salariul lor nu poate fi calculat. Setează-l la Setări → Utilizatori → [angajat].
            </div>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Angajat</th>
                {calc === "suplimentare" ? (
                  <>
                    <th className="px-5 py-3">Ore normale</th>
                    <th className="px-5 py-3">Ore suplimentare</th>
                  </>
                ) : (
                  <th className="px-5 py-3">Ore lucrate</th>
                )}
                <th className="px-5 py-3">Tarif</th>
                <th className="px-5 py-3">Salariu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ profile, worked, regular, overtime, rate, salary }) => (
                <tr key={profile.id} className="border-t border-[#f2f4f7]">
                  <td className="px-5 py-3 text-[13.5px] font-bold text-foreground">{profile.full_name}</td>
                  {calc === "suplimentare" ? (
                    <>
                      <td className="px-5 py-3 text-[13px] text-[#344054]">{formatHM(regular)}</td>
                      <td className="px-5 py-3 text-[13px] text-[#344054]">{formatHM(overtime)}</td>
                    </>
                  ) : (
                    <td className="px-5 py-3 text-[13px] text-[#344054]">{formatHM(worked)}</td>
                  )}
                  <td className="px-5 py-3 text-[13px] text-[#344054]">
                    {rate != null ? `${rate.toFixed(2)} RON/h` : "—"}
                  </td>
                  <td className="px-5 py-3 text-[13.5px] font-bold text-foreground">
                    {salary != null ? `${salary.toFixed(2)} RON` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#eaecf0] bg-[#f9fafb]">
                <td className="px-5 py-3 text-[13px] font-bold text-foreground" colSpan={calc === "suplimentare" ? 3 : 2}>
                  Total
                </td>
                <td />
                <td className="px-5 py-3 text-[14px] font-extrabold text-foreground">{totalSalary.toFixed(2)} RON</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[13px] border border-border bg-white px-[18px] py-4">
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}

import Link from "next/link";
import { Clock } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, dailyWorkedHours, formatHM, startOfWeek, toISODate } from "@/app/(app)/pontaj/lib";
import { startOfOrgDay, todayInOrgTimeZone } from "@/lib/date";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";

const DAY_NAMES = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];

export default async function MobileTimesheetPage({ searchParams }: { searchParams: Promise<{ sapt?: string }> }) {
  const { sapt } = await searchParams;
  const offset = Math.max(-52, Math.min(0, Number.parseInt(sapt ?? "0", 10) || 0));
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const weekStart = addDays(startOfWeek(new Date(`${today}T00:00:00Z`)), offset * 7);
  const weekEnd = addDays(weekStart, 7);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("profile_id, job_id, event_type, occurred_at")
    .eq("profile_id", profile.id)
    .gte("occurred_at", startOfOrgDay(toISODate(weekStart)))
    .lt("occurred_at", startOfOrgDay(toISODate(weekEnd)));

  const rows = (entries ?? []).map((e) => ({ ...e, job_id: e.job_id ?? "" }));
  const byDay = dailyWorkedHours(rows, "work_start", "work_end");
  const weekTotal = [...byDay.values()].reduce((s, h) => s + h, 0);
  const todayHours = byDay.get(today) ?? 0;

  // An open work_start (no matching work_end yet) = clocked in right now.
  const sorted = [...rows].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const lastWork = [...sorted].reverse().find((e) => e.event_type === "work_start" || e.event_type === "work_end");
  const workingSince = offset === 0 && lastWork?.event_type === "work_start" ? lastWork.occurred_at : null;

  const target = organization.standard_hours_per_day * (organization.standard_workdays?.length ?? 5);
  const pct = Math.min(100, Math.round((weekTotal / Math.max(1, target)) * 100));
  const days = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i))).filter((d) => d <= today).reverse();

  const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" });
  const weekLabel = `${fmt.format(weekStart)} – ${fmt.format(addDays(weekStart, 6))}`;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Pontaj" subtitle={offset === 0 ? "Săptămâna curentă" : `${weekLabel}`} back="/mobil/meniu" />
      <div className="m-bd">
        <div className="m-r" style={{ justifyContent: "space-between", gap: 8 }}>
          <Link href={`/mobil/pontaj?sapt=${offset - 1}`} className="m-pl" aria-label="Săptămâna anterioară">← Înapoi</Link>
          <span className="m-mu m-sm">{weekLabel}</span>
          {offset < 0 ? <Link href={`/mobil/pontaj?sapt=${offset + 1}`} className="m-pl" aria-label="Săptămâna următoare">Înainte →</Link> : <span style={{ width: 70 }} />}
        </div>
        <div className="m-cd" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 18 }}>
          <div
            style={{
              width: 150, height: 150, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: `conic-gradient(var(--m-ac) 0 ${pct}%, var(--m-chip) ${pct}% 100%)`,
            }}
          >
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--m-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{formatHM(weekTotal)}</div>
              <div className="m-mu" style={{ fontSize: 12 }}>din {target} h</div>
            </div>
          </div>
          <div className="m-r" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {workingSince ? (
              <span className="m-pl ok">În lucru de la {new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(new Date(workingSince))}</span>
            ) : (
              <span className="m-pl">Nu ești într-o lucrare acum</span>
            )}
            <span className="m-pl">Azi {formatHM(todayHours)}</span>
          </div>
        </div>

        {days.length === 0 || weekTotal === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={Clock} title="Nicio oră înregistrată">Orele apar automat când pornești și închei lucrările.</EmptyScreen>
          </div>
        ) : (
          <div className="m-list">
            {days.map((d) => {
              const idx = (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7;
              return (
                <div key={d}>
                  <div className="m-row">
                    <div className="m-fl">
                      <div className="t" style={{ textTransform: "capitalize" }}>{DAY_NAMES[idx]} {Number(d.slice(8))}</div>
                    </div>
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>{formatHM(byDay.get(d) ?? 0)}</b>
                  </div>
                  <hr className="m-sep" />
                </div>
              );
            })}
          </div>
        )}
        <div className="m-mu m-sm" style={{ textAlign: "center" }}>
          Orele se calculează din „Pornește lucrul” și „Finalizează”. Dacă ceva nu e corect, spune-i biroului.
        </div>
      </div>
    </div>
  );
}

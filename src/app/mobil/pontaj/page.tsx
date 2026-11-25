import Link from "next/link";
import { Clock, MapPin, Pencil } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, dailyWorkedHours, formatHM, startOfWeek, toISODate } from "@/app/(app)/pontaj/lib";
import { startOfOrgDay, todayInOrgTimeZone } from "@/lib/date";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";
import { EVENT_LABEL, gpsProof, orgTime } from "@/lib/time-corrections";
import { StartWorkButton } from "../lucrari/[id]/job-footer";
import { withdrawTimeCorrection } from "./actions";

const DAY_NAMES = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];

type JobInfo = { id: string; display_number: number; title: string; status: string; require_arrival_photo: boolean | null; locations: { lat: number | null; lng: number | null } | null };

export default async function MobileTimesheetPage({ searchParams }: { searchParams: Promise<{ sapt?: string; trimis?: string }> }) {
  const { sapt, trimis } = await searchParams;
  const offset = Math.max(-52, Math.min(0, Number.parseInt(sapt ?? "0", 10) || 0));
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const weekStart = addDays(startOfWeek(new Date(`${today}T00:00:00Z`)), offset * 7);
  const weekEnd = addDays(weekStart, 7);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, profile_id, job_id, event_type, occurred_at, lat, lng")
    .eq("profile_id", profile.id)
    .gte("occurred_at", startOfOrgDay(toISODate(weekStart)))
    .lt("occurred_at", startOfOrgDay(toISODate(weekEnd)));

  const [{ data: assigned }, { data: corrections }] = await Promise.all([
    supabase
      .from("job_assignments")
      .select("jobs(id, display_number, title, status, scheduled_date, require_arrival_photo, locations(lat, lng))")
      .eq("profile_id", profile.id),
    supabase
      .from("time_corrections")
      .select("id, job_id, event_type, original_at, requested_at, reason, status, review_note, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const jobs = new Map<string, JobInfo & { scheduled_date: string }>();
  for (const a of assigned ?? []) if (a.jobs) jobs.set(a.jobs.id, a.jobs as JobInfo & { scheduled_date: string });
  const active = [...jobs.values()].find((j) => ["ajunsa", "in_lucru", "pauza"].includes(j.status));
  let activeHasArrivalPhoto = true;
  if (active?.status === "ajunsa" && active.require_arrival_photo) {
    const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", active.id).eq("category", "before");
    activeHasArrivalPhoto = (count ?? 0) > 0;
  }

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

        {trimis && <div className="m-note ac m-sm" role="status"><div className="m-fl"><b>Cererea de corecție a ajuns la birou.</b> Pontajul se schimbă după ce o aprobă.</div></div>}

        {active && offset === 0 && (
          <div className="m-cd m-col" style={{ gap: 10 }}>
            <div className="m-lb">Lucrarea de acum</div>
            <Link href={`/mobil/lucrari/${active.id}`} style={{ fontSize: 16, fontWeight: 800 }}>#{active.display_number} · {active.title}</Link>
            {active.status === "ajunsa" && activeHasArrivalPhoto && <StartWorkButton jobId={active.id} />}
            {active.status === "ajunsa" && !activeHasArrivalPhoto && <Link href={`/mobil/lucrari/${active.id}/foto?cat=before`} className="m-btn">Fă poza de sosire, apoi pornește lucrul</Link>}
            {active.status !== "ajunsa" && <Link href={`/mobil/lucrari/${active.id}/finalizare`} className="m-btn">Închide lucrarea</Link>}
          </div>
        )}

        {(corrections ?? []).length > 0 && (
          <div className="m-cd m-col" style={{ gap: 10 }}>
            <div className="m-lb">Corecțiile tale</div>
            {(corrections ?? []).map((c) => {
              const job = jobs.get(c.job_id);
              return (
                <div key={c.id} className="m-col" style={{ gap: 4 }}>
                  <div className="m-r" style={{ gap: 8 }}>
                    <span className="m-fl" style={{ fontWeight: 700, fontSize: 14.5 }}>{EVENT_LABEL[c.event_type]} · {job ? `#${job.display_number}` : "lucrare"}</span>
                    <span className={`m-pl ${c.status === "approved" ? "ok" : c.status === "rejected" ? "bad" : "wr"}`}>{c.status === "approved" ? "Aprobată" : c.status === "rejected" ? "Respinsă" : "În așteptare"}</span>
                  </div>
                  <div className="m-mu m-sm">
                    {c.original_at ? `${orgTime(c.original_at)} → ` : "Lipsea → "}<b>{orgTime(c.requested_at)}</b> · {c.reason}
                    {c.review_note ? ` · Birou: ${c.review_note}` : ""}
                  </div>
                  {c.status === "pending" && (
                    <form action={withdrawTimeCorrection}><input type="hidden" name="id" value={c.id} /><button className="m-link m-sm" style={{ color: "var(--m-mu)" }}>Retrage cererea</button></form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {days.length === 0 || rows.length === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={Clock} title="Nicio oră înregistrată">Orele apar automat când pornești și închei lucrările.</EmptyScreen>
          </div>
        ) : (
          <div className="m-list">
            {days.map((d) => {
              const idx = (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7;
              const dayEntries = sorted.filter((e) => todayInOrgTimeZone(new Date(e.occurred_at)) === d && (e.event_type === "work_start" || e.event_type === "work_end"));
              const dayJobs = [...new Set(dayEntries.map((e) => e.job_id))];
              return (
                <details key={d}>
                  <summary className="m-row" style={{ listStyle: "none", cursor: "pointer" }}>
                    <div className="m-fl">
                      <div className="t" style={{ textTransform: "capitalize" }}>{DAY_NAMES[idx]} {Number(d.slice(8))}</div>
                      <div className="m-mu" style={{ fontSize: 12 }}>{dayJobs.length ? `${dayJobs.length} ${dayJobs.length === 1 ? "lucrare" : "lucrări"} · atinge pentru ore` : "fără ore"}</div>
                    </div>
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>{formatHM(byDay.get(d) ?? 0)}</b>
                  </summary>
                  <div className="m-col" style={{ gap: 10, padding: "4px 0 12px" }}>
                    {dayJobs.map((jobId) => {
                      const job = jobs.get(jobId);
                      return (
                        <div key={jobId} className="m-col" style={{ gap: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{job ? `#${job.display_number} · ${job.title}` : "Lucrare"}</div>
                          {(["work_start", "work_end"] as const).map((ev) => {
                            const list = dayEntries.filter((e) => e.job_id === jobId && e.event_type === ev);
                            const entry = ev === "work_start" ? list[0] : list[list.length - 1];
                            const proof = entry ? gpsProof(entry, job?.locations) : null;
                            const href = `/mobil/pontaj/corectie?job=${jobId}&ev=${ev}&day=${d}${entry ? `&entry=${entry.id}` : ""}`;
                            return (
                              <div key={ev} className="m-r" style={{ gap: 8 }}>
                                <span className="m-fl m-sm">
                                  {EVENT_LABEL[ev]}: <b>{entry ? orgTime(entry.occurred_at) : "lipsește"}</b>
                                  {proof && <span className="m-mu" style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 6, fontSize: 11.5 }}><MapPin style={{ width: 12, height: 12 }} />{proof.label}</span>}
                                </span>
                                <Link href={href} className="m-pl" aria-label={`Corectează ${EVENT_LABEL[ev]}`}><Pencil style={{ width: 13, height: 13 }} /> Corectează</Link>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <hr className="m-sep" />
                </details>
              );
            })}
          </div>
        )}
        <div className="m-mu m-sm" style={{ textAlign: "center" }}>
          Orele se calculează din „Pornește lucrul” și „Închide lucrarea”. Dacă o oră e greșită, deschide ziua și apasă „Corectează”: biroul vede motivul și aprobă.
        </div>
      </div>
    </div>
  );
}

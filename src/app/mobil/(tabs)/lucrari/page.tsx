import Link from "next/link";
import { Briefcase, CalendarOff, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/status";
import { todayInOrgTimeZone } from "@/lib/date";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import type { MobileMapJob } from "@/components/mobile-map";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";

type View = "lista" | "calendar" | "harta";
type Range = "azi" | "saptamana" | "toate" | "finalizate";

const ACTIVE = ["in_drum", "ajunsa", "in_lucru", "pauza"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const RANGES: { id: Range; label: string }[] = [
  { id: "azi", label: "Azi" },
  { id: "saptamana", label: "Săptămâna" },
  { id: "toate", label: "Toate" },
  { id: "finalizate", label: "Finalizate" },
];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}
function startOfWeek(d: Date) {
  const day = d.getUTCDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}
function timeRange(start: string | null, end: string | null) {
  return `${start?.slice(0, 5) ?? "—"}${end ? ` – ${end.slice(0, 5)}` : ""}`;
}
function dayLabel(date: string, today: string) {
  const label = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
  return date === today ? `Azi · ${label}` : label;
}

export default async function MobileJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ vedere?: string; interval?: string; data?: string }>;
}) {
  const sp = await searchParams;
  const view: View = sp.vedere === "calendar" ? "calendar" : sp.vedere === "harta" ? "harta" : "lista";
  const range: Range = (RANGES.find((r) => r.id === sp.interval)?.id ?? "azi") as Range;

  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const todayDate = new Date(`${today}T00:00:00Z`);

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, priority, scheduled_date, start_time, end_time, clients(name), locations(address, lat, lng))"
    )
    .eq("profile_id", profile.id);

  const allJobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { vedere: view === "lista" ? undefined : view, interval: range === "azi" ? undefined : range, data: sp.data, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/mobil/lucrari?${s}` : "/mobil/lucrari";
  };

  const segment = (
    <div className="m-seg" role="tablist">
      {([["lista", "Listă"], ["calendar", "Calendar"], ["harta", "Hartă"]] as [View, string][]).map(([id, label]) => (
        <Link key={id} href={href({ vedere: id === "lista" ? undefined : id, interval: undefined, data: undefined })} className={view === id ? "on" : ""} role="tab" aria-selected={view === id}>
          {label}
        </Link>
      ))}
    </div>
  );

  // ===== Hartă =====
  if (view === "harta") {
    const open = allJobs
      .filter((j) => j.status !== "finalizata" && j.status !== "anulata")
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    const mapJobs: MobileMapJob[] = open
      .filter((j) => j.locations?.lat != null && j.locations?.lng != null)
      .map((j) => ({
        id: j.id,
        label: `#${j.display_number}`,
        sublabel: `${j.clients?.name ?? "Client"} · ${j.title}`,
        lat: j.locations!.lat!,
        lng: j.locations!.lng!,
        href: `/mobil/lucrari/${j.id}`,
      }));
    const nextJob = open.find((j) => j.scheduled_date === today) ?? open[0] ?? null;
    const routeTo = nextJob ? mapJobs.find((j) => j.id === nextJob.id) : undefined;

    const [{ data: warehouses }, { data: trailLog }] = await Promise.all([
      supabase.from("warehouses").select("id, name, lat, lng").eq("organization_id", organization.id),
      supabase
        .from("technician_position_log")
        .select("lat, lng, recorded_at")
        .eq("organization_id", organization.id)
        .eq("profile_id", profile.id)
        .gte("recorded_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
        .order("recorded_at", { ascending: true }),
    ]);
    const hq = organization.hq_lat != null && organization.hq_lng != null ? { lat: organization.hq_lat, lng: organization.hq_lng } : null;

    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Lucrări" />
        <div style={{ padding: "0 20px 12px" }}>{segment}</div>
        <div className="relative min-h-0 flex-1">
          <MobileMapLoader
            jobs={mapJobs}
            routeTo={routeTo}
            hq={hq}
            warehouses={(warehouses ?? []).filter((w) => w.lat != null && w.lng != null).map((w) => ({ id: w.id, name: w.name, lat: w.lat!, lng: w.lng! }))}
            trail={(trailLog ?? []).map((p) => [p.lat, p.lng] as [number, number])}
          />
          {mapJobs.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
              <span className="m-pl" style={{ background: "var(--m-card)", boxShadow: "0 4px 14px rgba(16,24,40,.12)" }}>Nicio lucrare cu adresă GPS momentan</span>
            </div>
          )}
        </div>
        {nextJob && (
          <div className="m-sheet" style={{ flexShrink: 0 }}>
            <div className="m-grab" />
            <div className="m-r">
              <span className="m-ic"><Briefcase className="m-i" /></span>
              <div className="m-fl">
                <div style={{ fontSize: 17, fontWeight: 800 }}>{nextJob.clients?.name ?? "Client"}</div>
                <div className="m-mu m-sm">
                  {nextJob.title}
                  {nextJob.locations?.address ? ` · ${nextJob.locations.address}` : ""}
                </div>
              </div>
            </div>
            <div className="m-r" style={{ gap: 10 }}>
              {routeTo ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${routeTo.lat},${routeTo.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="m-btn"
                  style={{ flex: 1 }}
                >
                  <Navigation className="m-i" /> Navighează
                </a>
              ) : null}
              <Link href={`/mobil/lucrari/${nextJob.id}`} className={routeTo ? "m-ib" : "m-btn"} style={routeTo ? { borderRadius: 18, width: 56, height: 56 } : undefined} aria-label="Deschide lucrarea">
                {routeTo ? <ChevronRight className="m-i" /> : "Deschide lucrarea"}
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== Calendar =====
  if (view === "calendar") {
    const selected = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : today;
    const weekStart = startOfWeek(new Date(`${selected}T00:00:00Z`));
    const days = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)));
    const prevWeek = toISODate(addDays(weekStart, -7));
    const nextWeek = toISODate(addDays(weekStart, 7));
    const counts = new Map<string, number>();
    for (const j of allJobs) counts.set(j.scheduled_date, (counts.get(j.scheduled_date) ?? 0) + 1);
    const dayJobs = allJobs.filter((j) => j.scheduled_date === selected).sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", ...o }).format(new Date(`${d}T12:00:00Z`));
    const rangeLabel = `${fmt(days[0], { day: "numeric", month: "long" })} – ${fmt(days[6], { day: "numeric", month: "long" })}`;

    return (
      <div className="flex flex-col">
        <ScreenHeader title="Lucrări" />
        <div className="m-bd" style={{ overflow: "visible" }}>
          {segment}
          <div className="m-r">
            <Link href={href({ vedere: "calendar", data: prevWeek })} className="m-ib sm" aria-label="Săptămâna anterioară"><ChevronLeft className="m-i" /></Link>
            <div className="m-fl" style={{ textAlign: "center", fontSize: 16, fontWeight: 800 }}>{rangeLabel}</div>
            <Link href={href({ vedere: "calendar", data: nextWeek })} className="m-ib sm" aria-label="Săptămâna următoare"><ChevronRight className="m-i" /></Link>
          </div>
          <div className="m-wk">
            {days.map((d, i) => (
              <Link key={d} href={href({ vedere: "calendar", data: d })} className={`m-wd ${d === selected ? "on" : ""}`}>
                <span>{WEEKDAYS[i]}</span>
                <b>{Number(d.slice(8))}</b>
                <i className={(counts.get(d) ?? 0) > 0 ? "" : "x"} />
              </Link>
            ))}
          </div>
          <div className="m-lb" style={{ marginTop: 4 }}>{dayLabel(selected, today)}</div>
          {dayJobs.length === 0 ? (
            <div className="m-cd" style={{ padding: 0 }}>
              <EmptyScreen icon={CalendarOff} title="Nicio lucrare">Nu ai lucrări programate în această zi.</EmptyScreen>
            </div>
          ) : (
            dayJobs.map((job) => (
              <Link key={job.id} href={`/mobil/lucrari/${job.id}`} className="m-ev" style={job.priority === "urgenta" ? { borderLeftColor: "#f59e0b" } : undefined}>
                <div className="m-r">
                  <div className="m-fl">
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--m-mu)" }}>{timeRange(job.start_time, job.end_time)}</div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{job.title}</div>
                    <div className="m-mu m-sm">{job.clients?.name ?? "Client"}{job.locations?.address ? ` · ${job.locations.address}` : ""}</div>
                  </div>
                  <span className={`m-pl ${job.status === "finalizata" ? "ok" : ACTIVE.includes(job.status) ? "ac" : ""}`}>{JOB_STATUS_LABELS[job.status]}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  // ===== Listă =====
  const weekStartStr = toISODate(startOfWeek(todayDate));
  const weekEndStr = toISODate(addDays(startOfWeek(todayDate), 6));
  let jobs = allJobs;
  if (range === "azi") jobs = jobs.filter((j) => j.scheduled_date === today || ACTIVE.includes(j.status));
  else if (range === "saptamana") jobs = jobs.filter((j) => j.scheduled_date >= weekStartStr && j.scheduled_date <= weekEndStr);
  else if (range === "finalizate") jobs = jobs.filter((j) => j.status === "finalizata");
  if (range !== "finalizate" && range !== "toate") jobs = jobs.filter((j) => j.status !== "anulata");

  jobs = [...jobs].sort((a, b) =>
    range === "finalizate" || range === "toate"
      ? b.scheduled_date.localeCompare(a.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")
      : a.scheduled_date.localeCompare(b.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")
  );
  const groups = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const key = range === "azi" ? today : job.scheduled_date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(job);
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Lucrări" />
      <div className="m-bd" style={{ overflow: "visible" }}>
        {segment}
        <div className="m-chips" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
          {RANGES.map((r) => (
            <Link key={r.id} href={href({ interval: r.id === "azi" ? undefined : r.id })} className={`m-chip ${range === r.id ? "on" : ""}`} style={{ whiteSpace: "nowrap" }}>
              {r.label}
              {r.id === "azi" && range === "azi" ? ` · ${jobs.length}` : ""}
            </Link>
          ))}
        </div>

        {groups.size === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={Briefcase} title="Nicio lucrare">Nu ai lucrări în această perioadă.</EmptyScreen>
          </div>
        ) : (
          [...groups.entries()].map(([date, dayJobs]) => (
            <div key={date} className="m-col" style={{ gap: 10 }}>
              <div className="m-lb">{dayLabel(date, today)}</div>
              {dayJobs.map((job) => {
                const active = ACTIVE.includes(job.status);
                return (
                  <Link key={job.id} href={`/mobil/lucrari/${job.id}`} className="m-cd" style={active ? { borderColor: "var(--m-ac)", borderWidth: 1.5 } : job.status === "finalizata" ? { opacity: 0.85 } : undefined}>
                    <div className="m-r">
                      <span className="m-ic"><Briefcase className="m-i" /></span>
                      <div className="m-fl">
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{job.title}</div>
                        <div className="m-mu m-sm">{job.clients?.name ?? "Client"} · {timeRange(job.start_time, job.end_time)}</div>
                      </div>
                      <ChevronRight className="m-chev" />
                    </div>
                    <div className="m-r" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <span className={`m-pl ${job.status === "finalizata" ? "ok" : active ? "ac" : ""}`}>{JOB_STATUS_LABELS[job.status]}</span>
                      {job.priority === "urgenta" && <span className="m-pl wr">Urgentă</span>}
                      {job.priority === "ridicata" && <span className="m-pl wr">Prioritate ridicată</span>}
                      {job.locations?.address && <span className="m-mu m-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{job.locations.address}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

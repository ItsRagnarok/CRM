import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase, CalendarCheck, ChevronRight, Clock, MessageCircle, Navigation, PhoneCall, ScanLine, Wallet, Package, MapPin,
} from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/status";
import { todayInOrgTimeZone } from "@/lib/date";
import { markNotificationRead } from "@/app/(app)/notifications-actions";
import { timeAgo } from "@/lib/notification-ui";
import { EmptyScreen, IconTile } from "@/components/mobile/ui";
import { DepartureAlert } from "./departure-alert";
import { ArrivalAlert } from "./arrival-alert";
import { StartJobButton } from "./start-job-button";
import { MobileBell } from "./mobile-bell";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}

const PRIORITY_RANK: Record<string, number> = { urgenta: 0, ridicata: 1, normala: 2 };
const ACTIVE = ["in_drum", "ajunsa", "in_lucru", "pauza"];

function timeRange(start: string | null, end: string | null) {
  return `${start?.slice(0, 5) ?? "—"}${end ? ` – ${end.slice(0, 5)}` : ""}`;
}

export default async function MobileHomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  // The old in-page calendar moved under "Lucrări".
  if (view === "calendar") redirect("/mobil/lucrari?vedere=calendar");

  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();
  const firstName = profile.full_name.split(" ")[0];
  const today = todayInOrgTimeZone();

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select(
      "jobs(id, display_number, title, status, priority, scheduled_date, start_time, end_time, mobile_stage, clients(name), locations(address, lat, lng))"
    )
    .eq("profile_id", profile.id);

  const allJobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));

  const todays = allJobs
    .filter((j) => j.scheduled_date === today || ACTIVE.includes(j.status))
    .filter((j, i, arr) => arr.findIndex((x) => x.id === j.id) === i)
    .sort((a, b) => {
      const aDone = a.status === "finalizata" ? 1 : 0;
      const bDone = b.status === "finalizata" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aActive = ACTIVE.includes(a.status) ? 0 : 1;
      const bActive = ACTIVE.includes(b.status) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      const aRank = PRIORITY_RANK[a.priority] ?? 2;
      const bRank = PRIORITY_RANK[b.priority] ?? 2;
      if (aRank !== bRank) return aRank - bRank;
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    });

  const openJobs = todays.filter((j) => j.status !== "finalizata" && j.status !== "anulata");
  const nextJob = openJobs[0] ?? null;
  const laterJobs = openJobs.slice(1);
  const doneCount = todays.filter((j) => j.status === "finalizata").length;

  const upcoming = nextJob
    ? null
    : allJobs
        .filter((j) => j.scheduled_date > today && j.status === "programata")
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || (a.start_time ?? "").localeCompare(b.start_time ?? ""))[0] ?? null;

  const nextUpcomingJob = openJobs.find(
    (j) => j.status === "programata" && j.start_time && j.locations?.lat != null && j.locations?.lng != null
  );
  const inDrumJob = allJobs.find((j) => j.status === "in_drum" && j.locations?.lat != null && j.locations?.lng != null);
  const { data: arrivalPrompt } = inDrumJob
    ? await supabase.from("arrival_prompts").select("attempts").eq("job_id", inDrumJob.id).maybeSingle()
    : { data: null };

  const [{ data: callRequests }, { count: unreadCount }, { data: unreadMessages }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, body, created_at")
      .eq("profile_id", profile.id)
      .eq("type", "call_request")
      .eq("is_read", false)
      .order("created_at", { ascending: false }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("is_read", false),
    supabase
      .from("notifications")
      .select("id, title, body, link, created_at")
      .eq("profile_id", profile.id)
      .eq("type", "message")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const latestMessage = unreadMessages?.[0] ?? null;

  const dateLabel = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="flex flex-col">
      <header className="m-hd">
        <div className="m-fl">
          <h1 className="m-t1" style={{ fontSize: 24 }}>{greeting()}, {firstName}</h1>
          <div className="m-mu" style={{ marginTop: 4, textTransform: "capitalize" }}>
            {dateLabel}
            {openJobs.length > 0 ? ` · ${openJobs.length} ${openJobs.length === 1 ? "lucrare" : "lucrări"} azi` : ""}
          </div>
        </div>
        <MobileBell profileId={profile.id} initialUnread={unreadCount ?? 0} />
      </header>

      <div className="m-bd" style={{ overflow: "visible" }}>
        {(callRequests ?? []).map((req) => (
          <div key={req.id} className="m-note ac">
            <IconTile icon={PhoneCall} />
            <div className="m-fl">
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{req.body}</div>
              {organization.phone && (
                <a href={`tel:${organization.phone}`} className="m-link" style={{ fontSize: 13.5 }}>
                  Sună acum — {organization.phone}
                </a>
              )}
            </div>
            <form action={markNotificationRead.bind(null, req.id)}>
              <button type="submit" className="m-pl">Am văzut</button>
            </form>
          </div>
        ))}

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
            job={{ id: inDrumJob.id, title: inDrumJob.title, lat: inDrumJob.locations.lat, lng: inDrumJob.locations.lng }}
            initialAttempts={arrivalPrompt?.attempts ?? 0}
          />
        )}

        {nextJob ? (
          <div className="m-cd" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, borderRadius: 24 }}>
            <div className="m-r">
              <div className="m-lb m-fl" style={{ color: "var(--m-aci)" }}>
                {ACTIVE.includes(nextJob.status) ? "Lucrarea activă" : "Următoarea lucrare"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{nextJob.start_time?.slice(0, 5) ?? "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{nextJob.title}</div>
              <div className="m-mu" style={{ marginTop: 6 }}>
                {nextJob.clients?.name ?? "Client"}
                {nextJob.locations?.address ? ` · ${nextJob.locations.address}` : ""}
              </div>
            </div>
            <div className="m-r" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className="m-pl ac">{JOB_STATUS_LABELS[nextJob.status]}</span>
              {nextJob.priority !== "normala" && <span className="m-pl wr">{nextJob.priority === "urgenta" ? "Urgentă" : "Prioritate ridicată"}</span>}
            </div>
            {nextJob.status === "programata" && !nextJob.mobile_stage ? (
              <StartJobButton jobId={nextJob.id} jobTitle={nextJob.title} address={nextJob.locations?.address ?? null} />
            ) : (
              <Link href={`/mobil/lucrari/${nextJob.id}`} className="m-btn">
                <Navigation className="m-i" />
                Continuă lucrarea
              </Link>
            )}
            <Link href={`/mobil/lucrari/${nextJob.id}`} className="m-link" style={{ textAlign: "center" }}>
              Vezi detaliile
            </Link>
          </div>
        ) : (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={CalendarCheck} title={doneCount > 0 ? "Ai terminat pentru azi" : "Nicio lucrare azi"}>
              {doneCount > 0 ? `Ai finalizat ${doneCount} ${doneCount === 1 ? "lucrare" : "lucrări"}. Bună treabă.` : "Bucură-te de zi."}
              {upcoming && (
                <>
                  <br />
                  Următoarea: <b style={{ color: "var(--m-ink)" }}>{new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${upcoming.scheduled_date}T12:00:00Z`))}{upcoming.start_time ? `, ${upcoming.start_time.slice(0, 5)}` : ""}</b> — {upcoming.title}
                </>
              )}
            </EmptyScreen>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { href: "/mobil/scaneaza", label: "Scanează", icon: ScanLine, primary: true },
            { href: "/mobil/pontaj", label: "Pontaj", icon: Clock },
            { href: "/mobil/materiale", label: "Materiale", icon: Package },
            { href: "/mobil/cheltuieli", label: "Cheltuială", icon: Wallet },
          ].map(({ href, label, icon: Icon, primary }) => (
            <Link key={href} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span
                className="m-ic"
                style={{
                  width: 60, height: 60, borderRadius: 20,
                  ...(primary ? {} : { background: "var(--m-card)", border: "1px solid var(--m-ln)", color: "var(--m-ink)" }),
                }}
              >
                <Icon className="m-i" style={{ width: 26, height: 26 }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
            </Link>
          ))}
        </div>

        {latestMessage && (
          <Link href={latestMessage.link ?? "/mobil/mesaje"} className="m-note ac">
            <IconTile icon={MessageCircle} />
            <div className="m-fl">
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{latestMessage.title}</div>
              {latestMessage.body && (
                <div className="m-mu m-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latestMessage.body}</div>
              )}
              <div className="m-mu" style={{ fontSize: 11.5, marginTop: 2 }}>{timeAgo(latestMessage.created_at)}</div>
            </div>
            <ChevronRight className="m-chev" />
          </Link>
        )}

        {laterJobs.length > 0 && (
          <>
            <div className="m-lb" style={{ marginTop: 2 }}>Mai târziu azi</div>
            {laterJobs.map((job) => (
              <Link key={job.id} href={`/mobil/lucrari/${job.id}`} className="m-cd m-r">
                <div style={{ width: 54, fontSize: 15, fontWeight: 800 }}>{timeRange(job.start_time, null)}</div>
                <div className="m-fl">
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{job.title}</div>
                  <div className="m-mu m-sm">{job.clients?.name ?? "Client"}</div>
                </div>
                <ChevronRight className="m-chev" />
              </Link>
            ))}
          </>
        )}

        {todays.length > 0 && (
          <Link href="/mobil/lucrari" className="m-bt2 sm">
            <Briefcase className="m-i" style={{ width: 18, height: 18 }} />
            Toate lucrările
          </Link>
        )}
        {nextJob?.locations?.address && (
          <div className="m-mu m-sm" style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
            <MapPin className="m-i" style={{ width: 14, height: 14 }} /> Ruta spre locație se deschide în Google Maps sau Waze
          </div>
        )}
      </div>
    </div>
  );
}

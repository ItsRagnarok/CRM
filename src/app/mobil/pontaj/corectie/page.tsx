import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/mobile/ui";
import { EVENT_LABEL, gpsProof, orgTime } from "@/lib/time-corrections";
import { CorrectionForm } from "./correction-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TimeCorrectionPage({ searchParams }: { searchParams: Promise<{ job?: string; ev?: string; entry?: string; day?: string }> }) {
  const sp = await searchParams;
  const ev = sp.ev === "work_end" ? "work_end" : sp.ev === "work_start" ? "work_start" : null;
  if (!sp.job || !UUID.test(sp.job) || !ev || !sp.day || !/^\d{4}-\d{2}-\d{2}$/.test(sp.day)) notFound();
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, display_number, title, locations(lat, lng)").eq("id", sp.job).eq("organization_id", organization.id).maybeSingle();
  if (!job) notFound();
  const entry = sp.entry && UUID.test(sp.entry)
    ? (await supabase.from("time_entries").select("id, occurred_at, lat, lng").eq("id", sp.entry).eq("profile_id", profile.id).maybeSingle()).data
    : null;
  const proof = entry ? gpsProof(entry, job.locations) : null;
  const dayLabel = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${sp.day}T12:00:00Z`));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Corectează ora" subtitle={`#${job.display_number} · ${job.title}`} back="/mobil/pontaj" />
      <div className="m-bd">
        <div className="m-cd m-col" style={{ gap: 6 }}>
          <div className="m-lb">{EVENT_LABEL[ev]} · <span style={{ textTransform: "capitalize" }}>{dayLabel}</span></div>
          <div style={{ fontSize: 15 }}>Ora înregistrată: <b>{entry ? orgTime(entry.occurred_at) : "lipsește"}</b></div>
          {proof && <div className="m-mu m-sm">{proof.label}. GPS-ul e doar informativ pentru birou.</div>}
        </div>
        <CorrectionForm jobId={job.id} event={ev} entryId={entry?.id ?? ""} day={sp.day} defaultTime={entry ? orgTime(entry.occurred_at) : ""} />
      </div>
    </div>
  );
}

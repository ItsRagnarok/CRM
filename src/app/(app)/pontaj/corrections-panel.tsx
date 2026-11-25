import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EVENT_LABEL, gpsProof, orgTime } from "@/lib/time-corrections";
import { reviewTimeCorrection } from "./actions";

const dayFmt = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "short", day: "numeric", month: "short" });

/** Cererile de corecție trimise din aplicație. GPS-ul e afișat doar ca dovadă, lângă ora inițială. */
export async function CorrectionsPanel({ organizationId, readOnly }: { organizationId: string; readOnly: boolean }) {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("time_corrections")
    .select("id, job_id, event_type, entry_id, original_at, requested_at, reason, created_at, profiles!time_corrections_profile_id_fkey(full_name), jobs(display_number, title, locations(lat, lng))")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at")
    .limit(50);
  if (!pending?.length) return null;
  const entryIds = pending.map((c) => c.entry_id).filter((id): id is string => Boolean(id));
  const { data: entries } = entryIds.length
    ? await supabase.from("time_entries").select("id, lat, lng").in("id", entryIds)
    : { data: [] as { id: string; lat: number | null; lng: number | null }[] };
  const byId = new Map((entries ?? []).map((e) => [e.id, e]));

  return (
    <section id="corectii" className="overflow-hidden rounded-[13px] border border-warning/40 bg-white">
      <div className="border-b border-[#f2f4f7] bg-warning-bg px-5 py-3.5 text-[14.5px] font-bold">Corecții de pontaj de aprobat ({pending.length})</div>
      <div className="divide-y divide-[#f2f4f7]">
        {pending.map((c) => {
          const proof = c.original_at ? gpsProof(c.entry_id ? byId.get(c.entry_id) : null, c.jobs?.locations) : null;
          return (
            <div key={c.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1 text-[13.5px]">
                <div className="font-bold">{c.profiles?.full_name ?? "Tehnician"} · {EVENT_LABEL[c.event_type]} · <Link href={`/lucrari/${c.job_id}`} className="text-electric">#{c.jobs?.display_number} {c.jobs?.title}</Link></div>
                <div>
                  <span className="text-muted">{dayFmt.format(new Date(c.requested_at))}:</span>{" "}
                  {c.original_at ? <><s className="text-muted">{orgTime(c.original_at)}</s> → </> : <span className="text-muted">lipsea → </span>}
                  <b>{orgTime(c.requested_at)}</b>
                </div>
                <div className="text-[#344054]">„{c.reason}”</div>
                {proof && <div className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" /> Ora inițială: {proof.label}</div>}
              </div>
              {!readOnly && (
                <form action={reviewTimeCorrection.bind(null, "reject")} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="note" maxLength={300} placeholder="Notă (opțional)" aria-label="Notă pentru tehnician" className="w-44 rounded-lg border border-[#d0d5dd] px-2.5 py-1.5 text-[13px]" />
                  <button formAction={reviewTimeCorrection.bind(null, "approve")} data-decision="approve" className="rounded-lg bg-electric px-3 py-1.5 text-[13px] font-bold">Aprobă</button>
                  <button data-decision="reject" className="rounded-lg border border-danger/40 px-3 py-1.5 text-[13px] font-semibold text-danger">Respinge</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

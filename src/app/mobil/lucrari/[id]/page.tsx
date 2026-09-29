import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, ChevronRight, Receipt, Camera } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { startWork } from "./actions";
import { ArriveButton } from "./arrive-button";
import { StartTravelButton } from "./start-travel-button";
import { DistancePanel } from "./distance-panel";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import { acknowledgeRejectedPurchase } from "./actions";
import { Store, XCircle } from "lucide-react";

function mapsHref(address: string | null, lat: number | null, lng: number | null) {
  if (lat != null && lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return null;
}

export default async function MobileJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, display_number, title, description, admin_message, status, scheduled_date, start_time, end_time, arrived_at, work_started_at, work_ended_at, observations, clients(name, phone), locations(address, lat, lng)"
    )
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!job) notFound();

  const maps = mapsHref(job.locations?.address ?? null, job.locations?.lat ?? null, job.locations?.lng ?? null);
  const isTraveling = job.status === "programata" || job.status === "in_drum";
  const isDone = job.status === "finalizata";
  const isWorking = job.status === "in_lucru" || job.status === "pauza";

  const [{ count: photoCount }, { count: expenseCount }] = isWorking
    ? await Promise.all([
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("job_id", id),
      ])
    : [{ count: 0 }, { count: 0 }];

  const { data: purchaseRequests } = await supabase
    .from("purchase_requests")
    .select("id, custom_name, store_name, status, fulfilled_at, technician_acknowledged_at, materials(name)")
    .eq("job_id", id)
    .eq("requested_by", profile.id)
    .in("status", ["approved", "denied"]);

  const pendingPickup = (purchaseRequests ?? []).find((r) => r.status === "approved" && !r.fulfilled_at);
  const unseenRejections = (purchaseRequests ?? []).filter((r) => r.status === "denied" && !r.technician_acknowledged_at);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold">
            #{job.display_number} — {job.title}
          </div>
          <div className="text-[11.5px] text-muted-2">{job.clients?.name ?? "Client"}</div>
        </div>
        <div className="flex-1" />
        <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${JOB_STATUS_STYLES[job.status]}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="text-[12.5px] text-muted-2">
            {job.scheduled_date} · {job.start_time?.slice(0, 5) ?? "—"}
            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
          </div>
          {job.description && <div className="mt-2 text-[13px] text-[#344054]">{job.description}</div>}
          {job.locations?.address && (
            <div className="mt-2 text-[12.5px] text-muted">📍 {job.locations.address}</div>
          )}
          {job.clients?.phone && (
            <a href={`tel:${job.clients.phone}`} className="mt-1 block text-[12.5px] font-semibold text-electric">
              📞 {job.clients.phone}
            </a>
          )}
        </div>

        {pendingPickup && (
          <Link
            href={`/mobil/lucrari/${id}/achizitie/${pendingPickup.id}`}
            className="mt-3 flex items-center gap-3 rounded-[13px] border border-success-bg bg-success-bg p-3.5"
          >
            <Store className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <div className="text-[13px] font-bold text-success">
                Aprobat: {pendingPickup.materials?.name ?? pendingPickup.custom_name}
              </div>
              <div className="text-[11.5px] text-success">
                {pendingPickup.store_name ? `Cumpără de la ${pendingPickup.store_name}` : "Poți cumpăra de la orice magazin"} — atinge aici
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-success" />
          </Link>
        )}

        {unseenRejections.map((r) => (
          <div key={r.id} className="mt-3 flex items-center gap-3 rounded-[13px] border border-danger-bg bg-danger-bg p-3.5">
            <XCircle className="h-5 w-5 shrink-0 text-danger" />
            <div className="flex-1 text-[13px] font-semibold text-danger">
              Cererea pentru {r.materials?.name ?? r.custom_name} a fost respinsă.
            </div>
            <form action={acknowledgeRejectedPurchase.bind(null, r.id, id)}>
              <button type="submit" className="rounded-[8px] bg-white px-2.5 py-1.5 text-[11px] font-bold text-danger">
                Am înțeles
              </button>
            </form>
          </div>
        ))}

        {job.admin_message && (
          <div className="mt-3 rounded-[13px] border border-electric bg-electric-soft/40 p-3.5">
            <div className="text-[11px] font-bold text-electric">MESAJ DE LA ADMINISTRATOR</div>
            <div className="mt-1 text-[13px] text-[#344054]">{job.admin_message}</div>
          </div>
        )}

        {job.locations?.lat != null && job.locations?.lng != null && !isDone && (
          <div className="mt-3 h-[160px] overflow-hidden rounded-[13px] border border-[#eaecf0]">
            <MobileMapLoader
              jobs={[
                {
                  id: job.id,
                  label: job.title,
                  sublabel: job.locations.address ?? "",
                  lat: job.locations.lat,
                  lng: job.locations.lng,
                  href: `/mobil/lucrari/${job.id}`,
                },
              ]}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {job.status === "programata" && (
            <>
              <Link
                href={`/mobil/lucrari/${job.id}/checklist`}
                className="flex items-center gap-3 rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-electric-soft">
                  <ClipboardList className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold">Checklist înainte de plecare</div>
                  <div className="text-[11px] text-muted-2">Ce trebuie să iei — scule, materiale</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-2" />
              </Link>
              <Link
                href={`/mobil/lucrari/${job.id}/cheltuiala`}
                className="flex items-center gap-3 rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-electric-soft">
                  <Receipt className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold">Îți lipsesc materiale/scule?</div>
                  <div className="text-[11px] text-muted-2">Adaugă cheltuiala înainte să pleci</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-2" />
              </Link>
            </>
          )}

          {isTraveling && (
            <>
              {job.locations?.lat != null && job.locations?.lng != null && (
                <DistancePanel lat={job.locations.lat} lng={job.locations.lng} />
              )}
              {maps && (
                <a
                  href={maps}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[12px] border border-[#d0d5dd] bg-white py-3.5 text-center text-[14px] font-bold text-[#344054]"
                >
                  Deschide în Hărți
                </a>
              )}
              {job.status === "programata" ? (
                <StartTravelButton
                  jobId={job.id}
                  jobTitle={job.title}
                  address={job.locations?.address ?? null}
                />
              ) : (
                <ArriveButton jobId={job.id} />
              )}
            </>
          )}

          {job.status === "ajunsa" && (
            <>
              <div className="rounded-[12px] border border-success-bg bg-success-bg p-4 text-center">
                <div className="text-[13.5px] font-bold text-success">✓ Ai ajuns la locație</div>
                {job.arrived_at && (
                  <div className="mt-1 text-[12px] text-success">
                    {new Date(job.arrived_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              <Link
                href={`/mobil/lucrari/${job.id}/foto?cat=before`}
                className="flex items-center gap-3 rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-electric-soft">
                  <Camera className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold">Poză la locul de muncă</div>
                  <div className="text-[11px] text-muted-2">Ex: panoul electric, tabloul, zona de lucru</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-2" />
              </Link>
              <form action={startWork.bind(null, job.id)}>
                <button
                  type="submit"
                  className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
                >
                  PORNEȘTE LUCRUL
                </button>
              </form>
            </>
          )}

          {isWorking && (
            <>
              <Link
                href={`/mobil/lucrari/${job.id}/foto?cat=during`}
                className="block rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
              >
                ADAUGĂ POZĂ
              </Link>
              <Link
                href={`/mobil/lucrari/${job.id}/extra`}
                className="block rounded-[12px] border border-[#d0d5dd] bg-white py-[15px] text-center text-[15px] font-extrabold text-[#344054]"
              >
                MENIU LUCRARE — probleme, comentarii, finalizare
              </Link>
              <div className="text-center text-[12px] text-muted-2">
                Fotografii ({photoCount ?? 0})
                {expenseCount ? ` · ${expenseCount} cheltuieli adăugate` : ""}
              </div>
            </>
          )}

          {isDone && (
            <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
              <div className="text-[13.5px] font-bold text-success">✓ Lucrare finalizată</div>
              {job.work_ended_at && (
                <div className="mt-1 text-[12px] text-muted-2">
                  Finalizată {new Date(job.work_ended_at).toLocaleString("ro-RO")}
                </div>
              )}
              {job.observations && <div className="mt-2 text-[13px] text-[#344054]">{job.observations}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


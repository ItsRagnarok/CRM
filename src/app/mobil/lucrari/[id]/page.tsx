import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardList, ChevronRight, Camera, Warehouse } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { startWork, beginJobPrep } from "./actions";
import { mobileStagePath } from "./mobile-stage";
import { ArriveButton } from "./arrive-button";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import { acknowledgeRejectedPurchase } from "./actions";
import { Store, XCircle } from "lucide-react";
import { StepBadge } from "./step-badge";

export default async function MobileJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, display_number, title, description, admin_message, status, mobile_stage, require_arrival_photo, require_during_photo, photo_guidance_during, scheduled_date, start_time, end_time, arrived_at, work_started_at, work_ended_at, observations, clients(name, phone), locations(address, lat, lng)"
    )
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!job) notFound();

  // Once a technician has stepped into the pre-departure wizard, re-opening
  // the job (from home, from the list, from anywhere) must drop him back at
  // exactly the screen he left — never the start of the wizard again.
  if (job.status === "in_drum" && job.mobile_stage && job.mobile_stage !== "ready") {
    redirect(mobileStagePath(id, job.mobile_stage as "checklist" | "depozit" | "ridicare" | "cheltuiala"));
  }

  // Status flips to in_drum the moment "Start" is pressed (see beginJobPrep),
  // so by the time the wizard reaches "ready" the job is already traveling —
  // there's no separate "confirm and start driving" step anymore.
  const isTraveling = job.status === "in_drum" && job.mobile_stage === "ready";
  const isDone = job.status === "finalizata";
  const isWorking = job.status === "in_lucru" || job.status === "pauza";
  const currentStep =
    isTraveling ? "pornire" : job.status === "ajunsa" ? "sosire" : isWorking ? "executie" : null;

  const [{ count: photoCount }, { count: expenseCount }, { count: duringPhotoCount }] = isWorking
    ? await Promise.all([
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("job_id", id),
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id).eq("category", "during"),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }];
  const needsDuringPhoto = isWorking && job.require_during_photo && (duringPhotoCount ?? 0) === 0;

  const { count: beforePhotoCount } =
    job.status === "ajunsa"
      ? await supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("job_id", id)
          .eq("category", "before")
      : { count: 0 };

  const { data: requiredItems } =
    job.status === "programata" && !job.mobile_stage
      ? await supabase
          .from("job_required_items")
          .select("id, kind, quantity_needed, custom_name, materials(name, unit)")
          .eq("job_id", id)
          .order("created_at")
      : { data: [] };

  const { data: purchaseRequests } = await supabase
    .from("purchase_requests")
    .select("id, custom_name, store_name, status, fulfilled_at, technician_acknowledged_at, materials(name)")
    .eq("job_id", id)
    .eq("requested_by", profile.id)
    .in("status", ["approved", "denied"]);

  const pendingPickup = (purchaseRequests ?? []).find((r) => r.status === "approved" && !r.fulfilled_at);
  const unseenRejections = (purchaseRequests ?? []).filter((r) => r.status === "denied" && !r.technician_acknowledged_at);

  const jobPin =
    job.locations?.lat != null && job.locations?.lng != null
      ? {
          id: job.id,
          label: job.title,
          sublabel: job.locations.address ?? "",
          lat: job.locations.lat,
          lng: job.locations.lng,
          href: `/mobil/lucrari/${job.id}`,
        }
      : null;

  const hq =
    organization.hq_lat != null && organization.hq_lng != null
      ? { lat: organization.hq_lat, lng: organization.hq_lng }
      : null;

  const needsArrivalPhoto = job.require_arrival_photo && (beforePhotoCount ?? 0) === 0;

  // Geocoding can fail (address outside our coverage, typo, service hiccup),
  // leaving lat/lng null — the technician must still be able to navigate by
  // address text alone, not be left with zero options.
  const destination =
    job.locations?.lat != null && job.locations?.lng != null
      ? `${job.locations.lat},${job.locations.lng}`
      : job.locations?.address
        ? encodeURIComponent(job.locations.address)
        : null;
  const wazeHref =
    job.locations?.lat != null && job.locations?.lng != null
      ? `https://waze.com/ul?ll=${job.locations.lat},${job.locations.lng}&navigate=yes`
      : job.locations?.address
        ? `https://waze.com/ul?q=${encodeURIComponent(job.locations.address)}&navigate=yes`
        : null;

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
        {currentStep && (
          <div className="mb-3">
            <StepBadge step={currentStep} />
          </div>
        )}
        <div className="rounded-[13px] border border-[#eaecf0] bg-white p-4">
          <div className="text-[12.5px] text-muted-2">
            {job.scheduled_date} · {job.start_time?.slice(0, 5) ?? "—"}
            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
          </div>
          {job.description && (
            <div className="mt-2 whitespace-pre-line text-[13px] text-[#344054]">{job.description}</div>
          )}
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

        {requiredItems && requiredItems.length > 0 && (
          <div className="mt-3 rounded-[13px] border border-[#eaecf0] bg-white p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-muted-2">
              <Warehouse className="h-3.5 w-3.5" /> MATERIALE ȘI SCULE NECESARE
            </div>
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {requiredItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.kind === "tool" ? "bg-purple-soft text-purple" : "bg-electric-soft text-electric"
                    }`}
                  >
                    {item.kind === "tool" ? "SCULĂ" : "MATERIAL"}
                  </span>
                  <span className="flex-1 text-[#344054]">{item.materials?.name ?? item.custom_name}</span>
                  <span className="font-bold text-muted-2">
                    {item.quantity_needed} {item.materials?.unit ?? "buc"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isTraveling ? (
          <>
            {jobPin && (
              <>
                <div className="mt-4 text-[12px] font-bold text-muted-2">PORNEȘTE SPRE LUCRARE</div>
                <div className="mt-1.5 h-[220px] overflow-hidden rounded-[13px] border border-[#eaecf0]">
                  <MobileMapLoader jobs={[jobPin]} routeTo={jobPin} hq={hq} />
                </div>
              </>
            )}

            {/* Explicit, always-in-flow navigation options — not just the
                map's own overlay — so both variants stay visible and
                tappable regardless of screen size. Falls back to the raw
                address when the location was never geocoded (e.g. an
                address outside our coverage), so the technician always has
                a way to navigate, not just when lat/lng resolved. */}
            {destination && wazeHref ? (
              <div className="mt-3 rounded-[13px] border border-[#eaecf0] bg-white p-3.5">
                <div className="mb-2.5 text-[12px] font-bold text-muted-2">NAVIGHEAZĂ CĂTRE LUCRARE</div>
                <div className="flex gap-2.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-[10px] bg-neutral-bg py-3 text-center text-[13px] font-bold text-[#344054]"
                  >
                    Deschide în Google Maps
                  </a>
                  <a
                    href={wazeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-[10px] bg-neutral-bg py-3 text-center text-[13px] font-bold text-[#344054]"
                  >
                    Deschide în Waze
                  </a>
                </div>
                {jobPin && (
                  <p className="mt-2 text-[11px] text-muted-2">
                    Sau folosește traseul din hartă de mai sus (navigare în aplicație).
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-[12px] border border-warning-bg bg-warning-bg p-3.5 text-center text-[12.5px] font-semibold text-[#7a5b0e]">
                Lucrarea nu are o adresă completată — cere administratorului să o adauge, ca să poți naviga.
              </div>
            )}
          </>
        ) : (
          jobPin &&
          !isDone && (
            <div className="mt-3 h-[160px] overflow-hidden rounded-[13px] border border-[#eaecf0]">
              <MobileMapLoader jobs={[jobPin]} />
            </div>
          )
        )}

        <div className="mt-4 flex flex-col gap-3">
          {job.status === "programata" && !job.mobile_stage && (
            <form action={beginJobPrep}>
              <input type="hidden" name="jobId" value={job.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
              >
                <ClipboardList className="h-[18px] w-[18px]" /> PORNEȘTE
              </button>
            </form>
          )}

          {isTraveling && (
            <ArriveButton jobId={job.id} jobLat={job.locations?.lat ?? undefined} jobLng={job.locations?.lng ?? undefined} />
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
              {needsArrivalPhoto ? (
                <div className="rounded-[12px] border border-warning-bg bg-warning-bg p-3.5 text-center text-[12.5px] font-semibold text-[#7a5b0e]">
                  Fă poza de sosire mai sus înainte să pornești lucrul.
                </div>
              ) : (
                <form action={startWork.bind(null, job.id)}>
                  <button
                    type="submit"
                    className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)]"
                  >
                    PORNEȘTE LUCRUL
                  </button>
                </form>
              )}
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
              <div className="-mt-2 text-center text-[11px] text-muted-2">
                {job.photo_guidance_during
                  ? job.photo_guidance_during
                  : job.require_during_photo
                    ? "Poză din timpul lucrării — obligatorie"
                    : "Poză din timpul lucrării — una sau mai multe (opțional)"}
              </div>

              <Link
                href={`/mobil/lucrari/${job.id}/extra`}
                className="block rounded-[12px] border border-[#d0d5dd] bg-white py-[15px] text-center text-[15px] font-extrabold text-[#344054]"
              >
                RAPORTEAZĂ — probleme sau comentarii
              </Link>

              <div className="text-center text-[12px] text-muted-2">
                Fotografii ({photoCount ?? 0})
                {expenseCount ? ` · ${expenseCount} cheltuieli adăugate` : ""}
              </div>

              <div className="mt-2 rounded-[13px] border border-[#eaecf0] bg-white p-4">
                <div className="text-[14px] font-bold text-foreground">Ai terminat lucrarea?</div>
                {needsDuringPhoto && (
                  <div className="mt-2.5 rounded-[10px] border border-warning-bg bg-warning-bg p-2.5 text-center text-[12px] font-semibold text-[#7a5b0e]">
                    Fă cel puțin o poză din timpul lucrării mai sus înainte să finalizezi.
                  </div>
                )}
                <div className="mt-3 flex gap-2.5">
                  {needsDuringPhoto ? (
                    <div className="flex-1 rounded-[12px] bg-neutral-bg py-3 text-center text-[14px] font-extrabold text-muted-2">
                      DA
                    </div>
                  ) : (
                    <Link
                      href={`/mobil/lucrari/${job.id}/finalizare`}
                      className="flex-1 rounded-[12px] bg-success py-3 text-center text-[14px] font-extrabold text-white"
                    >
                      DA
                    </Link>
                  )}
                  <button
                    type="button"
                    className="flex-1 rounded-[12px] bg-neutral-bg py-3 text-center text-[14px] font-extrabold text-[#344054]"
                  >
                    NU
                  </button>
                </div>
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

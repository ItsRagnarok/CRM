import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle, Camera, Check, ChevronRight, ClipboardList, Clock, FileText, Flag, MessageSquare, Navigation, Package, Phone, PenLine, ScanLine, Store, Truck, Wallet, Warehouse, Wrench, XCircle,
} from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/status";
import { acknowledgeRejectedPurchase } from "./actions";
import { JobFooter, WarmJobPages } from "./job-footer";
import { mobileStagePath } from "./mobile-stage";
import { StartJobButton } from "../../(tabs)/start-job-button";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import { FORM_TEMPLATES, TEMPLATE_BY_DOMAIN } from "@/lib/forms/templates";
import { defaultPhotoTag } from "@/lib/photo-tags";
import { QuickPhotoButton } from "./foto/photo-capture";
import { NotifyClient } from "./notify-client";
import { onTheWayMessage } from "@/lib/client-messages";
import { SITE_URL } from "@/lib/seo";
import { templateFor } from "@/lib/ssm";
import { JobDocuments } from "./documente/job-documents";

type Step = "pregatire" | "drum" | "loc" | "inchidere";
const STEPS: { id: Step; label: string; icon: typeof Clock }[] = [
  { id: "pregatire", label: "Pregătire", icon: Clock },
  { id: "drum", label: "Drum", icon: Truck },
  { id: "loc", label: "Pe loc", icon: Wrench },
  { id: "inchidere", label: "Închidere", icon: Flag },
];

function Journey({ current, done }: { current: Step | null; done: boolean }) {
  const idx = current ? STEPS.findIndex((s) => s.id === current) : STEPS.length;
  return (
    <div className="m-cd" style={{ padding: "14px 16px 10px" }}>
      <div className="m-lb" style={{ marginBottom: 6 }}>Progres lucrare</div>
      <div className="m-jr">
        {STEPS.map(({ id, label, icon: Icon }, i) => {
          const state = done || i < idx ? "dn" : i === idx ? "on" : "";
          return (
            <div key={id} className={`m-jn ${state}`}>
              <span className="d">{state === "dn" ? <Check className="m-i" /> : <Icon className="m-i" />}</span>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  href, icon: Icon, title, detail, status, required,
}: {
  href: string; icon: typeof Camera; title: string; detail: string; status?: React.ReactNode; required?: boolean;
}) {
  return (
    <Link href={href} className={`m-sec ${required ? "req" : ""}`}>
      <span className="m-ic"><Icon className="m-i" /></span>
      <div className="m-fl">
        <div style={{ fontSize: 15.5, fontWeight: 800 }}>{title}</div>
        <div className="m-mu m-sm">{detail}</div>
      </div>
      {status ?? <ChevronRight className="m-chev" />}
    </Link>
  );
}

export default async function MobileJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, display_number, title, description, admin_message, status, priority, domain, at_height, gas_building_id, mobile_stage, require_arrival_photo, require_during_photo, require_final_photo, photo_guidance_during, scheduled_date, start_time, end_time, arrived_at, work_ended_at, observations, clients(name, phone, preferred_channel), locations(address, lat, lng)"
    )
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  // Re-opening a job mid-preparation drops the technician back at the exact screen he left.
  if (job.status === "in_drum" && job.mobile_stage && job.mobile_stage !== "ready") {
    redirect(mobileStagePath(id, job.mobile_stage as "checklist" | "depozit" | "ridicare" | "cheltuiala"));
  }

  const isTraveling = job.status === "in_drum" && job.mobile_stage === "ready";
  const isArrived = job.status === "ajunsa";
  const isWorking = job.status === "in_lucru" || job.status === "pauza";
  const isOnSite = isArrived || isWorking;
  const isDone = job.status === "finalizata";
  const current: Step | null = isDone ? null : isOnSite ? "loc" : isTraveling ? "drum" : "pregatire";

  // Gazele au fișa de evidență proprie (Ord. 179): pe bloc, o fișă pe apartament; altfel, una pe lucrare.
  const isGas = job.domain === "gaze";
  const formTemplate = job.domain && !isGas ? FORM_TEMPLATES[TEMPLATE_BY_DOMAIN[job.domain]] : null;
  const [photos, expenses, usage, notes, signatures, purchases, required, jobForm, gasRecords, gasUnits] = await Promise.all([
    supabase.from("photos").select("category").eq("job_id", id),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("job_id", id).eq("submitted_by", profile.id),
    supabase.from("material_usage").select("id", { count: "exact", head: true }).eq("job_id", id),
    supabase.from("job_notes").select("id, kind", { count: "exact" }).eq("job_id", id),
    supabase.from("signatures").select("id", { count: "exact", head: true }).eq("job_id", id),
    supabase
      .from("purchase_requests")
      .select("id, custom_name, store_name, status, fulfilled_at, technician_acknowledged_at, materials(name)")
      .eq("job_id", id)
      .eq("requested_by", profile.id)
      .in("status", ["approved", "denied"]),
    job.status === "programata" && !job.mobile_stage
      ? supabase.from("job_required_items").select("id, kind, quantity_needed, custom_name, materials(name, unit)").eq("job_id", id).order("created_at")
      : Promise.resolve({ data: [] }),
    formTemplate
      ? supabase.from("job_forms").select("completed_at").eq("job_id", id).eq("template", formTemplate.id).maybeSingle()
      : Promise.resolve({ data: null }),
    isGas ? supabase.from("gas_records").select("unit_id, kind, completed_at").eq("job_id", id) : Promise.resolve({ data: [] as { unit_id: string | null; kind: string; completed_at: string | null }[] }),
    isGas && job.gas_building_id
      ? supabase.from("gas_units").select("id", { count: "exact", head: true }).eq("building_id", job.gas_building_id)
      : Promise.resolve({ count: 0 }),
  ]);
  const gasHere = (gasRecords.data ?? []).find((r) => r.unit_id === null);
  const gasDoneUnits = (gasRecords.data ?? []).filter((r) => r.unit_id && r.completed_at).length;
  const missingGasRecord = isGas && !job.gas_building_id && !gasHere?.completed_at;
  const formDone = Boolean(jobForm.data?.completed_at);
  const missingForm = Boolean(formTemplate) && !formDone;

  const photoRows = photos.data ?? [];
  const count = (cat: string) => photoRows.filter((p) => p.category === cat).length;
  const missingArrival = job.require_arrival_photo && count("before") === 0;
  const missingDuring = job.require_during_photo && count("during") === 0;
  const missing = [missingArrival && "poza de sosire", missingDuring && "poza din timpul lucrării"].filter(Boolean) as string[];
  const problemCount = (notes.data ?? []).filter((n) => n.kind === "problem").length;

  const pendingPickup = (purchases.data ?? []).find((r) => r.status === "approved" && !r.fulfilled_at);
  const unseenRejections = (purchases.data ?? []).filter((r) => r.status === "denied" && !r.technician_acknowledged_at);

  // SSM: verificarea de dinainte de lucru e făcută (de omul ăsta, pe lucrarea asta)?
  const ssmDone = isArrived
    ? Boolean((await supabase.from("ssm_checks").select("id").eq("job_id", id).eq("profile_id", profile.id).limit(1)).data?.length)
    : false;

  // Pe drum: mesajul pentru client, cu linkul de status (se creează dacă lucrarea nu are încă unul).
  let notifyText: string | null = null;
  if (isTraveling) {
    const { data: tok } = await supabase.rpc("ensure_job_status_link", { p_job: id });
    if (tok) notifyText = onTheWayMessage({ company: organization.name, techName: profile.full_name.split(" ")[0], link: `${SITE_URL}/status/${tok}` });
  }

  const hasCoords = job.locations?.lat != null && job.locations?.lng != null;
  const destination = hasCoords ? `${job.locations!.lat},${job.locations!.lng}` : job.locations?.address ? encodeURIComponent(job.locations.address) : null;
  const wazeHref = hasCoords
    ? `https://waze.com/ul?ll=${job.locations!.lat},${job.locations!.lng}&navigate=yes`
    : job.locations?.address
      ? `https://waze.com/ul?q=${encodeURIComponent(job.locations.address)}&navigate=yes`
      : null;
  const jobPin = hasCoords
    ? { id: job.id, label: job.title, sublabel: job.locations!.address ?? "", lat: job.locations!.lat!, lng: job.locations!.lng!, href: `/mobil/lucrari/${job.id}` }
    : null;
  const hq = organization.hq_lat != null && organization.hq_lng != null ? { lat: organization.hq_lat, lng: organization.hq_lng } : null;

  const scheduled = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${job.scheduled_date}T12:00:00Z`));

  return (
    <div className="flex h-full flex-col">
      <header className="m-hd">
        <Link href="/mobil/lucrari" aria-label="Înapoi" className="m-ib sm">
          <ChevronRight className="m-i" style={{ transform: "rotate(180deg)" }} />
        </Link>
        <div className="m-fl" style={{ textAlign: "center" }}>
          <div className="m-lb">Lucrare #{job.display_number}</div>
        </div>
        <span className={`m-pl ${isDone ? "ok" : isOnSite || isTraveling ? "ac" : ""}`}>{JOB_STATUS_LABELS[job.status]}</span>
      </header>

      <div className="m-bd">
        <div>
          <div className="m-r" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span className="m-pl">{scheduled}{job.start_time ? ` · ${job.start_time.slice(0, 5)}` : ""}</span>
            {job.priority === "urgenta" && <span className="m-pl wr">Urgentă</span>}
            {job.priority === "ridicata" && <span className="m-pl wr">Prioritate ridicată</span>}
          </div>
          <h1 className="m-t1" style={{ fontSize: 24 }}>{job.title}</h1>
        </div>

        <Journey current={current} done={isDone} />

        <div className="m-cd m-col" style={{ gap: 14 }}>
          <div className="m-r">
            <span className="m-ic"><ClipboardList className="m-i" /></span>
            <div className="m-fl">
              <div style={{ fontSize: 16, fontWeight: 800 }}>{job.clients?.name ?? "Client"}</div>
              <div className="m-mu m-sm">Client</div>
            </div>
            {job.clients?.phone && (
              <a href={`tel:${job.clients.phone}`} className="m-ib sm" aria-label={`Sună ${job.clients.name}`}>
                <Phone className="m-i" />
              </a>
            )}
          </div>
          {job.locations?.address && (
            <>
              <hr className="m-sep" />
              <div className="m-r">
                <span className="m-ic"><Navigation className="m-i" /></span>
                <div className="m-fl" style={{ fontSize: 15, fontWeight: 700 }}>{job.locations.address}</div>
                {destination && !isDone && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="m-ib sm ac" aria-label="Navighează">
                    <Navigation className="m-i" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {job.description && (
          <div className="m-cd">
            <div className="m-lb" style={{ marginBottom: 8 }}>Ce trebuie făcut</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-line" }}>{job.description}</div>
          </div>
        )}

        {job.admin_message && (
          <div className="m-note ac">
            <span className="m-ic"><MessageSquare className="m-i" /></span>
            <div className="m-fl">
              <div className="m-lb" style={{ color: "var(--m-aci)" }}>Mesaj de la birou</div>
              <div style={{ fontSize: 14.5, marginTop: 2 }}>{job.admin_message}</div>
            </div>
          </div>
        )}

        {pendingPickup && (
          <Link href={`/mobil/lucrari/${id}/achizitie/${pendingPickup.id}`} className="m-note" style={{ borderColor: "var(--m-ok)", background: "var(--m-ok-bg)" }}>
            <Store className="m-i" style={{ color: "var(--m-ok)" }} />
            <div className="m-fl">
              <div style={{ fontWeight: 800, color: "var(--m-ok)" }}>Aprobat: {pendingPickup.materials?.name ?? pendingPickup.custom_name}</div>
              <div className="m-sm" style={{ color: "var(--m-ok)" }}>{pendingPickup.store_name ? `Cumpără de la ${pendingPickup.store_name}` : "Poți cumpăra de la orice magazin"}</div>
            </div>
            <ChevronRight className="m-chev" />
          </Link>
        )}
        {unseenRejections.map((r) => (
          <div key={r.id} className="m-note bad">
            <XCircle className="m-i" style={{ color: "var(--m-bad)" }} />
            <div className="m-fl" style={{ fontWeight: 700, color: "var(--m-bad)" }}>Cererea pentru {r.materials?.name ?? r.custom_name} a fost respinsă.</div>
            <form action={acknowledgeRejectedPurchase.bind(null, r.id, id)}>
              <button type="submit" className="m-pl">Am înțeles</button>
            </form>
          </div>
        ))}

        {(required.data ?? []).length > 0 && (
          <div className="m-cd">
            <div className="m-lb" style={{ marginBottom: 8, display: "flex", gap: 6, alignItems: "center" }}><Warehouse className="m-i" style={{ width: 14, height: 14 }} /> Ia cu tine</div>
            {(required.data ?? []).map((item, i) => (
              <div key={item.id}>
                {i > 0 && <hr className="m-sep" />}
                <div className="m-row" style={{ padding: "9px 0" }}>
                  <span className={`m-pl ${item.kind === "tool" ? "" : "ac"}`}>{item.kind === "tool" ? "Sculă" : "Material"}</span>
                  <span className="m-fl" style={{ fontSize: 14.5 }}>{item.materials?.name ?? item.custom_name}</span>
                  <b style={{ fontSize: 13.5 }}>{item.quantity_needed} {item.materials?.unit ?? "buc"}</b>
                </div>
              </div>
            ))}
          </div>
        )}

        {isTraveling && (
          <>
            {notifyText && <NotifyClient text={notifyText} phone={job.clients?.phone ?? null} preferred={job.clients?.preferred_channel} />}
            {jobPin && (
              <div style={{ height: 230, borderRadius: 20, overflow: "hidden", border: "1px solid var(--m-ln)", flexShrink: 0 }}>
                <MobileMapLoader jobs={[jobPin]} routeTo={jobPin} hq={hq} />
              </div>
            )}
            {destination && wazeHref ? (
              <div className="m-r" style={{ gap: 10 }}>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="m-bt2 sm" style={{ flex: 1 }}>Google Maps</a>
                <a href={wazeHref} target="_blank" rel="noopener noreferrer" className="m-bt2 sm" style={{ flex: 1 }}>Waze</a>
              </div>
            ) : (
              <div className="m-note warn m-sm">Lucrarea nu are adresă. Cere biroului să o completeze ca să poți naviga.</div>
            )}
          </>
        )}

        {isOnSite && (
          <>
            <div className="m-lb" style={{ marginTop: 4 }}>La locație</div>
            <div className="m-r" style={{ gap: 10 }}>
              <QuickPhotoButton jobId={id} category={defaultPhotoTag({ arrived: isOnSite, working: isWorking, beforeCount: count("before") })} />
            </div>
            {isGas && job.gas_building_id && (
              <Section
                href={`/mobil/lucrari/${id}/bloc`}
                icon={ClipboardList}
                title="Apartamentele din bloc"
                detail={`${gasDoneUnits} din ${gasUnits.count ?? 0} făcute · fișă, absent, refuz, altă zi`}
                status={<span className="m-pl ac">{gasDoneUnits}/{gasUnits.count ?? 0}</span>}
              />
            )}
            {isGas && !job.gas_building_id && (
              <>
                <Section
                  href={`/mobil/lucrari/${id}/gaze/loc${gasHere ? "" : "?tip=verificare"}`}
                  icon={FileText}
                  title={gasHere?.kind === "revizie" ? "Fișa de evidență · revizie" : "Fișa de evidență · verificare"}
                  detail={gasHere?.completed_at ? "Încheiată și trimisă la birou" : "Ord. ANRE 179/2015 · obligatorie la închidere"}
                  required={!gasHere?.completed_at}
                  status={gasHere?.completed_at ? <span className="m-pl ok"><Check className="m-i" />Gata</span> : <span className="m-pl wr">{gasHere ? "Începută" : "De completat"}</span>}
                />
                {!gasHere && <Link href={`/mobil/lucrari/${id}/gaze/loc?tip=revizie`} className="m-link m-sm" style={{ color: "var(--m-mu)", paddingLeft: 4 }}>E revizie, nu verificare? Deschide fișa de revizie →</Link>}
              </>
            )}
            {formTemplate && (
              <Section
                href={`/mobil/lucrari/${id}/formular/${formTemplate.id}`}
                icon={FileText}
                title={formTemplate.label}
                detail={formDone ? "Completat" : `${formTemplate.description} · obligatoriu la închidere`}
                required={!formDone}
                status={formDone ? <span className="m-pl ok"><Check className="m-i" />Gata</span> : <span className="m-pl wr">De completat</span>}
              />
            )}
            <Section
              href={`/mobil/lucrari/${id}/foto?cat=${isArrived ? "before" : "during"}`}
              icon={Camera}
              title="Fotografii"
              detail={
                photoRows.length === 0
                  ? "Nicio poză încă"
                  : `${photoRows.length} ${photoRows.length === 1 ? "poză" : "poze"}${missing.length ? ` · mai trebuie ${missing.join(" și ")}` : ""}`
              }
              required={missing.length > 0}
              status={missing.length > 0 ? <span className="m-pl wr">{missing.length} lipsă</span> : photoRows.length > 0 ? <span className="m-pl ok"><Check className="m-i" />OK</span> : undefined}
            />
            {job.domain === "electric" && (
              <Section
                href={`/mobil/lucrari/${id}/foto?cat=hidden`}
                icon={Camera}
                title="Lucrări ascunse"
                detail={count("hidden") ? `${count("hidden")} poze · intră în procesul-verbal` : "Fă poze înainte să închizi traseele"}
                status={count("hidden") ? <span className="m-pl ok"><Check className="m-i" />{count("hidden")}</span> : undefined}
              />
            )}
            <Section href="/mobil/materiale" icon={Package} title="Materiale folosite" detail={(usage.count ?? 0) > 0 ? `${usage.count} ${usage.count === 1 ? "articol" : "articole"} înregistrate` : "Notează ce ai consumat"} />
            <Section href={`/mobil/cheltuieli/noua?job=${id}`} icon={Wallet} title="Cheltuială" detail={(expenses.count ?? 0) > 0 ? `${expenses.count} trimise la birou` : "Bon, combustibil, parcare"} />
            <Section href={`/mobil/scaneaza?job=${id}`} icon={ScanLine} title="Scanează un document" detail="Factură, etichetă, aviz" />
            <Section
              href={`/mobil/lucrari/${id}/extra`}
              icon={AlertTriangle}
              title="Note și probleme"
              detail={(notes.count ?? 0) > 0 ? `${notes.count} ${notes.count === 1 ? "notă" : "note"}${problemCount ? ` · ${problemCount} probleme` : ""}` : "Raportează o problemă sau lasă un comentariu"}
            />
            <Section href={`/mobil/lucrari/${id}/finalizare`} icon={FileText} title="Verificare finală" detail="Checklist de închidere, observații" />
            <Section href={`/mobil/lucrari/${id}/semnatura`} icon={PenLine} title="Semnătură client" detail={(signatures.count ?? 0) > 0 ? "Semnată" : "La finalul lucrării"} status={(signatures.count ?? 0) > 0 ? <span className="m-pl ok"><Check className="m-i" />Semnată</span> : undefined} />
          </>
        )}

        {isDone && (
          <div className="m-cd">
            <div className="m-r" style={{ marginBottom: 6 }}>
              <span className="m-ic"><Check className="m-i" /></span>
              <div className="m-fl">
                <div style={{ fontSize: 16, fontWeight: 800 }}>Lucrare finalizată</div>
                {job.work_ended_at && (
                  <div className="m-mu m-sm">
                    {new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(job.work_ended_at))}
                  </div>
                )}
              </div>
            </div>
            {job.observations && <div style={{ fontSize: 14.5, marginTop: 8 }}>{job.observations}</div>}
            {(signatures.count ?? 0) === 0 && (
              <Link href={`/mobil/lucrari/${id}/semnatura`} className="m-btn sm" style={{ marginTop: 12 }}><PenLine className="m-i" /> Adaugă semnătura</Link>
            )}
          </div>
        )}
        {isDone && <JobDocuments jobId={id} />}
      </div>

      {!isDone && (
        <div className="m-ft">
          {job.status === "programata" && !job.mobile_stage && (
            <StartJobButton jobId={job.id} jobTitle={job.title} address={job.locations?.address ?? null} />
          )}
          <JobFooter
            jobId={job.id}
            isTraveling={isTraveling}
            isArrived={isArrived}
            isWorking={isWorking}
            jobLat={job.locations?.lat ?? undefined}
            jobLng={job.locations?.lng ?? undefined}
            requireArrival={Boolean(job.require_arrival_photo)}
            requireDuring={Boolean(job.require_during_photo)}
            requireFinal={Boolean(job.require_final_photo)}
            serverPhotos={{ before: count("before"), during: count("during"), after: count("after") }}
            missingFormLabel={missingForm ? formTemplate!.label : missingGasRecord ? "Fișa de evidență gaze" : null}
            ssm={{ template: templateFor(job.domain, job.at_height), done: ssmDone }}
          />
        </div>
      )}
      {!isDone && <WarmJobPages jobId={job.id} formTemplateId={formTemplate?.id ?? null} extra={isGas ? [job.gas_building_id ? `/mobil/lucrari/${job.id}/bloc` : `/mobil/lucrari/${job.id}/gaze/loc${gasHere ? "" : "?tip=verificare"}`] : []} />}
    </div>
  );
}

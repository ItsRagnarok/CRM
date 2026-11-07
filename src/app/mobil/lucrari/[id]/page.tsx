import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle, Camera, Check, ChevronRight, ClipboardList, Clock, FileText, Flag, MessageSquare, Navigation, Package, Pause, Phone, PenLine, ScanLine, Store, Truck, Wallet, Warehouse, Wrench, XCircle,
} from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/status";
import { startWork, acknowledgeRejectedPurchase } from "./actions";
import { mobileStagePath } from "./mobile-stage";
import { ArriveButton } from "./arrive-button";
import { StartJobButton } from "../../(tabs)/start-job-button";
import { MobileMapLoader } from "@/components/mobile-map-loader";
import { FORM_TEMPLATES, TEMPLATE_BY_DOMAIN } from "@/lib/forms/templates";

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
      "id, display_number, title, description, admin_message, status, priority, domain, mobile_stage, require_arrival_photo, require_during_photo, require_final_photo, photo_guidance_during, scheduled_date, start_time, end_time, arrived_at, work_ended_at, observations, clients(name, phone), locations(address, lat, lng)"
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

  const formTemplate = job.domain ? FORM_TEMPLATES[TEMPLATE_BY_DOMAIN[job.domain]] : null;
  const [photos, expenses, usage, notes, signatures, purchases, required, jobForm] = await Promise.all([
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
  ]);
  const formDone = Boolean(jobForm.data?.completed_at);
  const missingForm = Boolean(formTemplate) && !formDone;

  const photoRows = photos.data ?? [];
  const count = (cat: string) => photoRows.filter((p) => p.category === cat).length;
  const missingArrival = job.require_arrival_photo && count("before") === 0;
  const missingDuring = job.require_during_photo && count("during") === 0;
  const missingFinal = job.require_final_photo && count("after") === 0;
  const missing = [missingArrival && "poza de sosire", missingDuring && "poza din timpul lucrării"].filter(Boolean) as string[];
  const problemCount = (notes.data ?? []).filter((n) => n.kind === "problem").length;

  const pendingPickup = (purchases.data ?? []).find((r) => r.status === "approved" && !r.fulfilled_at);
  const unseenRejections = (purchases.data ?? []).filter((r) => r.status === "denied" && !r.technician_acknowledged_at);

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
      </div>

      {!isDone && (
        <div className="m-ft">
          {job.status === "programata" && !job.mobile_stage && (
            <StartJobButton jobId={job.id} jobTitle={job.title} address={job.locations?.address ?? null} />
          )}
          {isTraveling && <ArriveButton jobId={job.id} jobLat={job.locations?.lat ?? undefined} jobLng={job.locations?.lng ?? undefined} />}
          {isArrived &&
            (missingArrival ? (
              <>
                <Link href={`/mobil/lucrari/${id}/foto?cat=before`} className="m-btn"><Camera className="m-i" /> Fă poza de sosire</Link>
                <div className="m-mu m-sm" style={{ textAlign: "center" }}>Poza de sosire e obligatorie înainte să pornești lucrul.</div>
              </>
            ) : (
              <form action={startWork.bind(null, job.id)}>
                <button type="submit" className="m-btn"><Wrench className="m-i" /> Pornește lucrul</button>
              </form>
            ))}
          {isWorking && (
            <>
              {missingDuring || missingForm ? (
                <>
                  <button type="button" className="m-btn off" disabled><Flag className="m-i" /> Închide lucrarea</button>
                  <div className="m-mu m-sm" style={{ textAlign: "center" }}>
                    Mai ai de făcut: {[missingDuring && "poza din timpul lucrării", missingForm && `formularul „${formTemplate!.label}”`].filter(Boolean).join(" și ")}.
                  </div>
                </>
              ) : (
                <Link href={`/mobil/lucrari/${id}/finalizare`} className="m-btn"><Flag className="m-i" /> Închide lucrarea</Link>
              )}
              <div className="m-r" style={{ justifyContent: "space-between" }}>
                <span className="m-mu m-sm">{missingFinal ? "Poza finală e cerută la închidere" : " "}</span>
                <Link href={`/mobil/lucrari/${id}/extra`} className="m-link" style={{ color: "var(--m-wr)", display: "flex", gap: 6, alignItems: "center" }}>
                  <Pause className="m-i" style={{ width: 16, height: 16 }} /> Nu pot finaliza
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

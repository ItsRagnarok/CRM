import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { avatarColor, initials } from "@/lib/avatar-color";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import {
  addContact,
  addLocation,
  addClientDocument,
  createInvoice,
  deleteContact,
  deleteClientDocument,
  deleteLocation,
  toggleClientStatus,
} from "../actions";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Power,
  Trash2,
  User,
  FileText,
  Image as ImageIcon,
  Receipt,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lucrari", label: "Lucrări" },
  { id: "documente", label: "Documente" },
  { id: "fotografii", label: "Fotografii" },
  { id: "facturi", label: "Facturi" },
  { id: "contacte", label: "Contacte" },
] as const;

function formatDateRo(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationError?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { locationError, tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam! : "overview";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "*, jobs(id, display_number, title, status, scheduled_date, start_time, job_assignments(profiles(full_name))), locations(id, address, label), client_contacts(id, name, role, phone, email)"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .order("scheduled_date", { ascending: false, foreignTable: "jobs" })
    .order("created_at", { ascending: true, foreignTable: "locations" })
    .order("created_at", { ascending: true, foreignTable: "client_contacts" })
    .maybeSingle();

  if (!client) notFound();

  const jobs = client.jobs;
  const locations = client.locations;
  const contacts = client.client_contacts;

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = [...jobs]
    .filter((j) => j.scheduled_date >= todayStr && j.status !== "finalizata" && j.status !== "anulata")
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  const nextJob = upcoming[0] ?? null;

  const [{ data: invoices }, { data: documents }, { data: photos }] = await Promise.all([
    tab === "overview" || tab === "facturi"
      ? supabase.from("invoices").select("id, invoice_number, total_amount, status, issued_at").eq("client_id", id).order("issued_at", { ascending: false })
      : Promise.resolve({ data: null }),
    tab === "documente"
      ? supabase.from("documents").select("id, name, doc_type, storage_path, created_at").eq("client_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    tab === "fotografii" && jobs.length > 0
      ? supabase.from("photos").select("id, category, storage_path, job_id").in("job_id", jobs.map((j) => j.id)).order("taken_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const totalValue = (invoices ?? []).reduce((sum, inv) => sum + Number(inv.total_amount ?? 0), 0);
  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
  const color = avatarColor(client.id);
  const tabHref = (t: string) => `/clienti/${id}?tab=${t}`;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link href="/clienti" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <span className="text-[13.5px] text-muted-2">Clienți /</span>
        <span className="text-[15px] font-bold text-foreground">{client.name}</span>
      </div>

      <div className="flex items-center justify-between rounded-[14px] border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-[18px] font-extrabold"
            style={{ background: color.bg, color: color.text }}
          >
            {initials(client.name)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="text-[20px] font-extrabold text-foreground">{client.name}</div>
              <StatusBadge
                label={client.status === "active" ? "Activ" : "Inactiv"}
                className={client.status === "active" ? "bg-success-bg text-success" : "bg-neutral-bg text-neutral"}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-[#475467]">
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted" /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted" /> {client.email}
                </span>
              )}
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted" /> {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/clienti/${client.id}/editeaza`}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] font-bold text-[#344054]"
          >
            <Pencil className="h-3.5 w-3.5" /> Editează
          </Link>
          <form action={toggleClientStatus}>
            <input type="hidden" name="clientId" value={client.id} />
            <input type="hidden" name="currentStatus" value={client.status} />
            <button type="submit" className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] font-bold text-[#344054]">
              <Power className="h-3.5 w-3.5" />
              {client.status === "active" ? "Dezactivează" : "Activează"}
            </button>
          </form>
          <Link
            href={`/lucrari/nou?clientId=${client.id}`}
            className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13px] font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Lucrare nouă
          </Link>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            className={`px-4 py-2.5 text-[13.5px] font-semibold ${
              tab === t.id ? "border-b-2 border-electric text-electric" : "text-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Număr lucrări" value={jobs.length} />
            <StatCard label="Valoare totală" value={`${totalValue.toFixed(0)} RON`} />
            <StatCard label="Ultima intervenție" value={jobs[0] ? formatDateRo(jobs[0].scheduled_date) : "—"} />
            <StatCard label="Următoarea lucrare" value={nextJob ? formatDateRo(nextJob.scheduled_date) : "—"} />
          </div>

          <div className="rounded-[13px] border border-border bg-white">
            <div className="border-b border-[#f2f4f7] px-5 py-3.5">
              <div className="text-[14.5px] font-bold text-foreground">Puncte de lucru</div>
              <p className="mt-0.5 text-[12px] text-muted-2">
                Adresele unde acest client are instalații (sediu, depozit, șantier). Fiecare lucrare nouă
                se leagă de unul din aceste puncte.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-5">
              {locationError && (
                <p className="rounded-[8px] bg-danger-bg px-3 py-2 text-[12.5px] font-medium text-danger">{locationError}</p>
              )}
              {locations.length > 0 ? (
                <div className="flex flex-col divide-y divide-[#f2f4f7]">
                  {locations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-3 py-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-muted" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-foreground">{loc.label || "Punct de lucru"}</div>
                        <div className="truncate text-[12px] text-muted-2">{loc.address}</div>
                      </div>
                      <form action={deleteLocation}>
                        <input type="hidden" name="locationId" value={loc.id} />
                        <input type="hidden" name="clientId" value={client.id} />
                        <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge punctul de lucru">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted">Niciun punct de lucru adăugat încă.</p>
              )}
              <form action={addLocation} className="mt-2 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
                <input type="hidden" name="clientId" value={client.id} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="label" placeholder="Etichetă (opțional)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                  <input name="address" required placeholder="Adresă" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                </div>
                <button type="submit" className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
                  <Plus className="h-3.5 w-3.5" /> Adaugă punct de lucru
                </button>
              </form>
            </div>
          </div>

          <JobHistory jobs={jobs} />
        </>
      )}

      {tab === "lucrari" && (
        <div className="rounded-[13px] border border-dashed border-border bg-white p-6">
          <p className="text-[13.5px] text-muted">
            Vezi toate lucrările acestui client, filtrabile pe status, în{" "}
            <Link href={`/lucrari?clientId=${client.id}`} className="font-semibold text-electric">
              secțiunea Lucrări →
            </Link>
          </p>
          <div className="mt-4">
            <JobHistory jobs={jobs} />
          </div>
        </div>
      )}

      {tab === "documente" && (
        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="text-[14.5px] font-bold text-foreground">Documente</h2>
          <p className="mb-3.5 mt-0.5 text-[12px] text-muted-2">
            Contracte, oferte, procese verbale de recepție, avize sau certificate legate de acest client —
            nu de o lucrare anume.
          </p>
          {documents && documents.length > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <a href={publicUrl(doc.storage_path)} target="_blank" rel="noreferrer" className="truncate text-[13px] font-semibold text-electric">
                      {doc.name}
                    </a>
                    <div className="text-[11.5px] text-muted-2">{doc.doc_type ?? "Document"}</div>
                  </div>
                  <form action={deleteClientDocument}>
                    <input type="hidden" name="documentId" value={doc.id} />
                    <input type="hidden" name="storagePath" value={doc.storage_path} />
                    <input type="hidden" name="clientId" value={client.id} />
                    <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge documentul">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Niciun document încă.</p>
          )}
          <form action={addClientDocument} className="mt-4 flex items-center gap-2 border-t border-[#f2f4f7] pt-4">
            <input type="hidden" name="clientId" value={client.id} />
            <input name="docType" placeholder="Tip (opțional)" className="w-40 rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
            <input name="file" type="file" required className="flex-1 text-[13px]" />
            <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
              <Plus className="h-3.5 w-3.5" /> Încarcă
            </button>
          </form>
        </div>
      )}

      {tab === "fotografii" && (
        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="mb-3.5 text-[14.5px] font-bold text-foreground">Fotografii — toate lucrările</h2>
          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-4 gap-3.5">
              {photos.map((p) => (
                <a key={p.id} href={publicUrl(p.storage_path)} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={publicUrl(p.storage_path)} alt="" className="h-[110px] w-full rounded-[9px] object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <ImageIcon className="h-4 w-4" /> Nicio fotografie încă pe lucrările acestui client.
            </p>
          )}
        </div>
      )}

      {tab === "facturi" && (
        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="mb-3.5 text-[14.5px] font-bold text-foreground">Facturi</h2>
          {invoices && invoices.length > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <div>
                    <div className="font-semibold text-foreground">{inv.invoice_number}</div>
                    <div className="text-[11.5px] text-muted-2">{new Date(inv.issued_at).toLocaleDateString("ro-RO")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#344054]">{Number(inv.total_amount).toFixed(2)} RON</span>
                    <StatusBadge
                      label={inv.status === "paid" ? "Plătită" : inv.status === "overdue" ? "Restantă" : "Neplătită"}
                      className={
                        inv.status === "paid"
                          ? "bg-success-bg text-success"
                          : inv.status === "overdue"
                            ? "bg-danger-bg text-danger"
                            : "bg-warning-bg text-warning"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Receipt className="h-4 w-4" /> Nicio factură emisă încă pentru acest client.
            </p>
          )}
          <form action={createInvoice} className="mt-4 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
            <input type="hidden" name="clientId" value={client.id} />
            {jobs.length > 0 && (
              <select name="jobId" defaultValue="" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric">
                <option value="">Fără lucrare asociată</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>#{j.display_number} — {j.title}</option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-4 gap-2">
              <input name="laborAmount" type="number" step="0.01" min="0" placeholder="Manoperă" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="materialsAmount" type="number" step="0.01" min="0" placeholder="Materiale" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="travelAmount" type="number" step="0.01" min="0" placeholder="Deplasare" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="otherAmount" type="number" step="0.01" min="0" placeholder="Altele" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
            </div>
            <button type="submit" className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
              <Plus className="h-3.5 w-3.5" /> Emite factură
            </button>
          </form>
        </div>
      )}

      {tab === "contacte" && (
        <div className="rounded-[13px] border border-border bg-white p-5">
          <h2 className="text-[14.5px] font-bold text-foreground">Persoane de contact</h2>
          <p className="mb-3.5 mt-0.5 text-[12px] text-muted-2">
            Oameni de legătură la acest client (administrator, responsabil tehnic, paznic) — diferiți de
            datele principale ale clientului, utili când suni pe cineva de la fața locului.
          </p>
          {contacts.length > 0 ? (
            <div className="flex flex-col divide-y divide-[#f2f4f7]">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 py-2.5">
                  <User className="h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {contact.name}
                      {contact.role && <span className="ml-1.5 font-normal text-muted-2">· {contact.role}</span>}
                    </div>
                    <div className="truncate text-[12px] text-muted-2">
                      {[contact.phone, contact.email].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <form action={deleteContact}>
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="clientId" value={client.id} />
                    <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge persoana de contact">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Nicio persoană de contact adăugată încă.</p>
          )}
          <form action={addContact} className="mt-4 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid grid-cols-2 gap-2">
              <input name="name" required placeholder="Nume" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="role" placeholder="Funcție (opțional)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="phone" placeholder="Telefon" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="email" type="email" placeholder="Email" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
            </div>
            <button type="submit" className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
              <Plus className="h-3.5 w-3.5" /> Adaugă persoană de contact
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[13px] border border-border bg-white p-[18px]">
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-2 text-[20px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}

type JobRow = {
  id: string;
  display_number: number;
  title: string;
  status: Database["public"]["Enums"]["job_status"];
  scheduled_date: string;
  start_time: string | null;
  job_assignments: { profiles: { full_name: string } | null }[];
};

function JobHistory({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="rounded-[13px] border border-border bg-white">
      <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">Istoric lucrări</div>
      {jobs.length > 0 ? (
        <div className="flex flex-col divide-y divide-[#f2f4f7]">
          {jobs.map((job) => {
            const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
            return (
              <Link key={job.id} href={`/lucrari/${job.id}`} prefetch={false} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]">
                <div className="w-16 shrink-0 text-[13px] font-bold text-electric">#{job.display_number}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-foreground">{job.title}</div>
                  <div className="text-[12px] text-muted-2">
                    {job.scheduled_date}
                    {assignees.length > 0 ? ` · ${assignees.join(", ")}` : ""}
                  </div>
                </div>
                <StatusBadge label={JOB_STATUS_LABELS[job.status]} className={JOB_STATUS_STYLES[job.status]} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="p-5 text-[13.5px] text-muted">Acest client nu are încă nicio lucrare.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "./status-actions";
import { LiveJobTimer } from "./live-timer";
import {
  addChecklistItem,
  addExpense,
  addRequiredItem,
  deleteChecklistItem,
  deleteDocument,
  deleteRequiredItem,
  setJobWarehouse,
  toggleChecklistItem,
  uploadDocument,
} from "./actions";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  JOB_TYPE_LABELS,
} from "@/lib/status";
import {
  ArrowLeft,
  MapPin,
  UsersRound,
  Calendar,
  Pencil,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Check,
  Package,
  Clock,
  Fuel,
  Receipt,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { id: "rezumat", label: "Rezumat" },
  { id: "materiale", label: "Materiale" },
  { id: "fotografii", label: "Fotografii" },
  { id: "cheltuieli", label: "Costuri" },
  { id: "pontaj", label: "Pontaj" },
  { id: "checklist", label: "Checklist" },
  { id: "raport", label: "Raport" },
  { id: "documente", label: "Documente" },
] as const;

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  before: "ÎNAINTE",
  during: "ÎN TIMPUL LUCRĂRII",
  after: "DUPĂ",
};

const TIME_EVENT_LABELS: Record<string, string> = {
  travel_start: "Plecare spre locație",
  arrival: "Sosire la locație",
  work_start: "Început lucrare",
  pauza_start: "Pauză",
  work_resume: "Continuare lucrare",
  work_end: "Finalizare lucrare",
};

function formatDateRo(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam! : "rezumat";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "*, clients(id, name), locations(address), teams(id, name), job_assignments(profiles(full_name))"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();

  const [
    { data: photos },
    { data: expenses },
    { data: timeEntries },
    { data: checklist },
    { data: materialUsage },
    { data: documents },
    { data: signature },
    { data: requiredItems },
    { data: catalog },
    { data: jobNotes },
    { data: warehouses },
    { data: invoice },
  ] = await Promise.all([
    supabase.from("photos").select("id, category, storage_path, taken_at").eq("job_id", id).order("taken_at"),
    supabase.from("expenses").select("id, category, vendor, amount, currency, expense_date, receipt_path").eq("job_id", id).order("created_at"),
    supabase
      .from("time_entries")
      .select("id, profile_id, event_type, occurred_at, profiles(full_name, hourly_rate)")
      .eq("job_id", id)
      .order("occurred_at"),
    supabase
      .from("job_checklists")
      .select("id, job_checklist_items(id, label, is_checked, sort_order)")
      .eq("job_id", id)
      .eq("phase", "after")
      .order("sort_order", { ascending: true, foreignTable: "job_checklist_items" })
      .maybeSingle(),
    supabase
      .from("material_usage")
      .select("id, quantity, materials(name, unit, unit_cost)")
      .eq("job_id", id),
    supabase.from("documents").select("id, name, doc_type, storage_path, created_at").eq("job_id", id).order("created_at"),
    supabase.from("signatures").select("signer_name, storage_path, signed_at").eq("job_id", id).maybeSingle(),
    supabase
      .from("job_required_items")
      .select("id, kind, quantity_needed, custom_name, materials(id, name, unit, unit_cost)")
      .eq("job_id", id)
      .order("created_at"),
    supabase.from("materials").select("id, name, unit").eq("organization_id", organization.id).order("name"),
    supabase
      .from("job_notes")
      .select("id, kind, text, photo_path, created_at, profiles(full_name)")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("warehouses").select("id, name").eq("organization_id", organization.id).order("name"),
    supabase.from("invoices").select("id, total_amount, status").eq("job_id", id).maybeSingle(),
  ]);

  const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const checklistItems = checklist?.job_checklist_items ?? [];
  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
  const tabHref = (t: string) => `/lucrari/${id}?tab=${t}`;

  // Cost breakdown — materials actually used (not just planned), labor time
  // at each technician's hourly rate, an estimated travel/fuel cost from the
  // logged distance, and every ad-hoc expense (parts, tools, parking...).
  // Rates are opt-in (hourly_rate / material unit_cost can be unset), so a
  // missing rate contributes 0 rather than breaking the total — the line
  // still shows so the admin knows what's not priced yet.
  const materialsCost = (materialUsage ?? []).reduce(
    (sum, m) => sum + Number(m.quantity) * (m.materials?.unit_cost ?? 0),
    0
  );

  const laborByProfile = new Map<string, { name: string; rate: number | null; hours: number }>();
  {
    const byProfile = new Map<string, typeof timeEntries>();
    for (const e of timeEntries ?? []) {
      if (!byProfile.has(e.profile_id)) byProfile.set(e.profile_id, []);
      byProfile.get(e.profile_id)!.push(e);
    }
    for (const [profileId, events] of byProfile) {
      const sorted = [...(events ?? [])].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
      let openStart: number | null = null;
      let totalMs = 0;
      for (const e of sorted) {
        const t = new Date(e.occurred_at).getTime();
        if (e.event_type === "work_start") openStart = t;
        else if (e.event_type === "work_end" && openStart != null) {
          totalMs += t - openStart;
          openStart = null;
        }
      }
      const first = sorted[0];
      laborByProfile.set(profileId, {
        name: first?.profiles?.full_name ?? "Tehnician",
        rate: first?.profiles?.hourly_rate ?? null,
        hours: totalMs / 3_600_000,
      });
    }
  }
  const laborCost = [...laborByProfile.values()].reduce((sum, p) => sum + p.hours * (p.rate ?? 0), 0);

  const travelCost = (job.distance_km ?? 0) * organization.fuel_cost_per_km;
  const totalCost = materialsCost + laborCost + travelCost + totalExpenses;
  const revenue = invoice?.total_amount ?? null;
  const profit = revenue != null ? revenue - totalCost : null;

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-border bg-white px-7 py-4.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/lucrari" className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-neutral-bg">
            <ArrowLeft className="h-[15px] w-[15px] text-[#344054]" />
          </Link>
          <h1 className="text-[17px] font-extrabold text-foreground">
            Lucrare #{job.display_number} — {job.title}
          </h1>
          <StatusBadge label={JOB_STATUS_LABELS[job.status]} className={JOB_STATUS_STYLES[job.status]} />
          {(job.status === "in_lucru" || job.status === "pauza") && job.work_started_at && (
            <LiveJobTimer startedAt={job.work_started_at} />
          )}
          <div className="flex-1" />
          <Link
            href={`/lucrari/${id}/editeaza`}
            className="flex items-center gap-1.5 rounded-[9px] border border-[#d0d5dd] px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
          >
            <Pencil className="h-3.5 w-3.5" /> Editează
          </Link>
          <StatusActions jobId={job.id} status={job.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-6 text-[13px] text-[#475467]">
          {job.clients && (
            <Link href={`/clienti/${job.clients.id}`} className="flex items-center gap-1.5 font-semibold">
              <UsersRound className="h-3.5 w-3.5 text-muted" /> {job.clients.name}
            </Link>
          )}
          {job.locations?.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted" /> {job.locations.address}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 text-muted" />{" "}
            {job.teams?.name
              ? `${job.teams.name}${assignees.length > 0 ? ` (${assignees.join(" + ")})` : ""}`
              : "neasignată"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted" /> {formatDateRo(job.scheduled_date)}
          </span>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              className={`whitespace-nowrap px-3.5 py-2.5 text-[13px] font-semibold ${
                tab === t.id ? "border-b-2 border-electric text-electric" : "text-muted"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-7">
        {tab === "rezumat" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="flex flex-col gap-4">
              <Card title="Informații generale">
                <div className="grid grid-cols-3 gap-4">
                  <InfoField label="DATA" value={job.scheduled_date} />
                  <InfoField label="DURATĂ" value={formatDuration(job.work_started_at, job.work_ended_at)} />
                  <InfoField label="DISTANȚĂ" value={job.distance_km != null ? `${job.distance_km} km` : "—"} />
                  <InfoField label="ORA SOSIRII" value={formatTime(job.arrived_at)} />
                  <InfoField label="ORA PLECĂRII" value={formatTime(job.work_ended_at)} />
                  <InfoField label="TIP LUCRARE" value={JOB_TYPE_LABELS[job.job_type]} />
                </div>
                <div className="mt-4 border-t border-[#f2f4f7] pt-4">
                  <div className="text-[11.5px] font-semibold text-muted-2">DESCRIERE</div>
                  <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#344054]">
                    {job.description || "Fără descriere adăugată încă."}
                  </p>
                </div>
                {job.admin_message && (
                  <div className="mt-4 border-t border-[#f2f4f7] pt-4">
                    <div className="text-[11.5px] font-semibold text-muted-2">MESAJ PENTRU TEHNICIAN</div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#344054]">{job.admin_message}</p>
                  </div>
                )}
                {job.equipment_issue_note && (
                  <div className="mt-4 border-t border-[#f2f4f7] pt-4">
                    <div className="text-[11.5px] font-semibold text-danger">DEFECȚIUNI SCULE/ECHIPAMENTE</div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#344054]">{job.equipment_issue_note}</p>
                  </div>
                )}
              </Card>

              {jobNotes && jobNotes.length > 0 && (
                <Card title="Note tehnician (probleme & comentarii)">
                  <div className="flex flex-col divide-y divide-[#f2f4f7]">
                    {jobNotes.map((n) => (
                      <div key={n.id} className="py-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[12.5px] font-semibold ${n.kind === "problem" ? "text-danger" : "text-[#344054]"}`}
                          >
                            {n.kind === "problem" ? "⚠ " : ""}
                            {n.text}
                          </span>
                          <span className="text-[11px] text-muted-2">
                            {n.profiles?.full_name ?? "—"} · {new Date(n.created_at).toLocaleString("ro-RO")}
                          </span>
                        </div>
                        {n.photo_path && (
                          <a href={publicUrl(n.photo_path)} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={publicUrl(n.photo_path)}
                              alt=""
                              className="mt-2 h-[100px] w-[100px] rounded-[8px] object-cover"
                            />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <PhotosCard photos={photos ?? []} publicUrl={publicUrl} jobId={id} />

              <Card title="Pontaj">
                <TimeEntriesList entries={timeEntries ?? []} />
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <ReportCard jobId={id} />
              <SignatureCard signature={signature ?? null} publicUrl={publicUrl} />
              <Card title="Cheltuieli lucrare">
                <ExpensesList expenses={expenses ?? []} total={totalExpenses} publicUrl={publicUrl} />
              </Card>
              <Card title="Checklist final">
                <ChecklistPreview items={checklistItems} jobId={id} />
              </Card>
            </div>
          </div>
        )}

        {tab === "materiale" && (
          <div className="flex flex-col gap-4">
            {warehouses && warehouses.length > 0 && (
              <Card title="Depozit de ridicare">
                <form action={setJobWarehouse} className="flex items-center gap-3">
                  <input type="hidden" name="jobId" value={id} />
                  <select
                    name="warehouseId"
                    defaultValue={job.warehouse_id ?? ""}
                    className="flex-1 rounded-[9px] border border-[#d0d5dd] px-3 py-2.5 text-[13px] outline-none focus:border-electric"
                  >
                    <option value="">— fără depozit specific —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-[9px] bg-electric px-4 py-2.5 text-[13px] font-bold text-white">
                    Salvează
                  </button>
                </form>
                <p className="mt-2 text-[11.5px] text-muted-2">
                  Depozitul de unde tehnicianul trebuie să ridice materialele/sculele necesare acestei lucrări.
                </p>
              </Card>
            )}
            <Card title="Materiale & scule necesare pentru această lucrare">
              {requiredItems && requiredItems.length > 0 ? (
                <div className="flex flex-col divide-y divide-[#f2f4f7]">
                  {requiredItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                          item.kind === "tool" ? "bg-purple-soft text-purple" : "bg-electric-soft text-electric"
                        }`}
                      >
                        {item.kind === "tool" ? "SCULĂ" : "MATERIAL"}
                      </span>
                      <span className="flex-1 text-foreground">
                        {item.materials?.name ?? item.custom_name}
                      </span>
                      <span className="font-bold text-[#344054]">
                        {item.quantity_needed} {item.materials?.unit ?? "buc"}
                      </span>
                      <form action={deleteRequiredItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="jobId" value={id} />
                        <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  Nimic definit încă — tehnicianul vede doar stocul general al vehiculului până completezi lista de mai jos.
                </p>
              )}

              <form action={addRequiredItem} className="mt-4 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
                <input type="hidden" name="jobId" value={id} />
                <div className="grid grid-cols-[100px_1fr_1fr_80px_auto] gap-2">
                  <select name="kind" className="rounded-[9px] border border-[#d0d5dd] px-2 py-2 text-[12.5px] font-semibold outline-none focus:border-electric">
                    <option value="material">Material</option>
                    <option value="tool">Sculă</option>
                  </select>
                  <select name="materialId" className="rounded-[9px] border border-[#d0d5dd] px-2 py-2 text-[13px] outline-none focus:border-electric">
                    <option value="">— alege din catalog —</option>
                    {(catalog ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <input name="customName" placeholder="…sau nume liber (ex: scară 3m)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                  <input name="quantity" type="number" min={1} defaultValue={1} className="rounded-[9px] border border-[#d0d5dd] px-2 py-2 text-center text-[13px] outline-none focus:border-electric" />
                  <button type="submit" className="flex items-center justify-center gap-1.5 rounded-[9px] bg-neutral-bg px-3 py-2 text-[12.5px] font-bold text-[#344054]">
                    <Plus className="h-3.5 w-3.5" /> Adaugă
                  </button>
                </div>
                <p className="text-[11.5px] text-muted-2">
                  Alege fie un material din catalog, fie scrie un nume liber (pentru scule care nu sunt în catalog) — nu ambele.
                </p>
              </form>
            </Card>

            <Card title="Materiale folosite">
            {materialUsage && materialUsage.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {materialUsage.map((mu) => (
                  <div key={mu.id} className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-foreground">{mu.materials?.name}</span>
                    <span className="font-bold text-[#344054]">
                      {mu.quantity} {mu.materials?.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">
                Niciun material înregistrat încă. Catalogul de materiale al companiei e gol —
                completează-l din{" "}
                <Link href="/materiale" className="font-semibold text-electric">
                  secțiunea Materiale
                </Link>{" "}
                pentru a putea înregistra consum pe lucrare.
              </p>
            )}
            </Card>
          </div>
        )}

        {tab === "fotografii" && (
          <PhotosCard photos={photos ?? []} publicUrl={publicUrl} jobId={id} full />
        )}

        {tab === "cheltuieli" && (
          <div className="flex flex-col gap-4">
            <Card title="Cost & profit lucrare">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CostLine icon={Package} label="Materiale folosite" value={materialsCost} />
                <CostLine icon={Clock} label="Manoperă" value={laborCost} />
                <CostLine icon={Fuel} label="Deplasare (combustibil)" value={travelCost} />
                <CostLine icon={Receipt} label="Cheltuieli" value={totalExpenses} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-neutral-bg px-4 py-3">
                <div className="text-[13px] font-bold text-foreground">
                  Cost total: {totalCost.toFixed(2)} RON
                </div>
                {revenue != null ? (
                  <div className="flex items-center gap-1.5 text-[13px] font-bold">
                    <TrendingUp className={`h-4 w-4 ${(profit ?? 0) >= 0 ? "text-success" : "text-danger"}`} />
                    <span className={(profit ?? 0) >= 0 ? "text-success" : "text-danger"}>
                      Profit: {(profit ?? 0).toFixed(2)} RON
                    </span>
                    <span className="text-[11.5px] font-medium text-muted-2">
                      (facturat {revenue.toFixed(2)} RON)
                    </span>
                  </div>
                ) : (
                  <div className="text-[12px] font-medium text-muted-2">
                    Fără factură emisă încă — profitul se calculează după facturare.
                  </div>
                )}
              </div>
              {laborByProfile.size > 0 && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-[#f2f4f7] pt-3">
                  {[...laborByProfile.values()].map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px] text-muted">
                      <span>{p.name}</span>
                      <span>
                        {p.hours.toFixed(1)}h
                        {p.rate != null ? ` × ${p.rate.toFixed(2)} RON/h = ${(p.hours * p.rate).toFixed(2)} RON` : " — fără tarif orar setat"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11.5px] text-muted-2">
                Materialele fără preț de achiziție setat sau tehnicienii fără tarif orar setat contribuie cu 0 RON la
                cost — completează-le în Materiale, respectiv Setări utilizator.
              </p>
            </Card>

            <Card title="Cheltuieli lucrare">
              <ExpensesList expenses={expenses ?? []} total={totalExpenses} publicUrl={publicUrl} />
            <form action={addExpense} className="mt-4 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
              <input type="hidden" name="jobId" value={id} />
              <div className="grid grid-cols-3 gap-2">
                <input name="category" required placeholder="Categorie (materiale, combustibil…)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                <input name="vendor" placeholder="Furnizor (opțional)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
                <input name="amount" type="number" step="0.01" min="0.01" required placeholder="Sumă (RON)" className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              </div>
              <input name="receipt" type="file" accept="image/*,application/pdf" className="text-[12.5px]" />
              <button type="submit" className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
                <Plus className="h-3.5 w-3.5" /> Adaugă cheltuială
              </button>
            </form>
            </Card>
          </div>
        )}

        {tab === "pontaj" && (
          <Card title="Pontaj">
            <TimeEntriesList entries={timeEntries ?? []} />
          </Card>
        )}

        {tab === "checklist" && (
          <Card title="Checklist lucrare">
            {checklistItems.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 py-2.5">
                    <form action={toggleChecklistItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="jobId" value={id} />
                      <input type="hidden" name="isChecked" value={String(item.is_checked)} />
                      <button
                        type="submit"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          item.is_checked ? "border-success bg-success text-white" : "border-[#d0d5dd]"
                        }`}
                        aria-label="Bifează"
                      >
                        {item.is_checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                    </form>
                    <span className={`flex-1 text-[13px] ${item.is_checked ? "text-[#344054]" : "text-muted"}`}>
                      {item.label}
                    </span>
                    <form action={deleteChecklistItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="jobId" value={id} />
                      <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Niciun element în checklist încă.</p>
            )}
            <form action={addChecklistItem} className="mt-4 flex items-center gap-2 border-t border-[#f2f4f7] pt-4">
              <input type="hidden" name="jobId" value={id} />
              <input name="label" required placeholder="Element checklist nou…" className="w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
                <Plus className="h-3.5 w-3.5" /> Adaugă
              </button>
            </form>
          </Card>
        )}

        {tab === "raport" && <ReportCard jobId={id} full />}

        {tab === "documente" && (
          <Card title="Documente">
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
                    <form action={deleteDocument}>
                      <input type="hidden" name="documentId" value={doc.id} />
                      <input type="hidden" name="storagePath" value={doc.storage_path} />
                      <input type="hidden" name="jobId" value={id} />
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
            <form action={uploadDocument} className="mt-4 flex items-center gap-2 border-t border-[#f2f4f7] pt-4">
              <input type="hidden" name="jobId" value={id} />
              <input name="docType" placeholder="Tip (opțional)" className="w-40 rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
              <input name="file" type="file" required className="flex-1 text-[13px]" />
              <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
                <Plus className="h-3.5 w-3.5" /> Încarcă
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[13px] border border-border bg-white p-5">
      <h2 className="mb-3.5 text-[14.5px] font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function CostLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[10px] border border-[#eaecf0] p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-2">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-[15px] font-extrabold text-foreground">{value.toFixed(2)} RON</div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold text-muted-2">{label}</div>
      <div className="mt-1 text-[13.5px] font-bold text-foreground">{value}</div>
    </div>
  );
}

function PhotosCard({
  photos,
  publicUrl,
  jobId,
  full,
}: {
  photos: { id: string; category: string; storage_path: string; taken_at: string }[];
  publicUrl: (path: string) => string;
  jobId: string;
  full?: boolean;
}) {
  const shown = full ? photos : photos.slice(0, 6);
  return (
    <Card title="Fotografii">
      {!full && photos.length > 0 && (
        <Link href={`/lucrari/${jobId}?tab=fotografii`} className="mb-3 -mt-2 block text-right text-[12px] font-semibold text-electric">
          Vezi toate ({photos.length}) →
        </Link>
      )}
      {shown.length > 0 ? (
        <div className="grid grid-cols-3 gap-3.5">
          {shown.map((p) => (
            <a key={p.id} href={publicUrl(p.storage_path)} target="_blank" rel="noreferrer" className="block">
              <div className="mb-1.5 text-[10.5px] font-bold text-muted-2">
                {PHOTO_CATEGORY_LABELS[p.category] ?? p.category.toUpperCase()}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl(p.storage_path)} alt="" className="h-[100px] w-full rounded-[9px] object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <ImageIcon className="h-4 w-4" /> Nicio fotografie încărcată încă.
        </p>
      )}
    </Card>
  );
}

function TimeEntriesList({ entries }: { entries: { id: string; event_type: string; occurred_at: string }[] }) {
  if (entries.length === 0) {
    return <p className="text-[13px] text-muted">Niciun eveniment de pontaj încă.</p>;
  }
  return (
    <div className="flex flex-col">
      {entries.map((e, i) => (
        <div key={e.id} className={`flex gap-3.5 py-2.5 ${i < entries.length - 1 ? "border-b border-[#f2f4f7]" : ""}`}>
          <div className="w-[52px] shrink-0 text-[13px] font-bold text-foreground">
            {new Date(e.occurred_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-[13px] text-[#344054]">{TIME_EVENT_LABELS[e.event_type] ?? e.event_type}</div>
        </div>
      ))}
    </div>
  );
}

function ExpensesList({
  expenses,
  total,
  publicUrl,
}: {
  expenses: {
    id: string;
    category: string;
    vendor: string | null;
    amount: number;
    currency: string;
    receipt_path?: string | null;
  }[];
  total: number;
  publicUrl: (path: string) => string;
}) {
  if (expenses.length === 0) {
    return <p className="text-[13px] text-muted">Nicio cheltuială înregistrată încă.</p>;
  }
  return (
    <>
      {expenses.map((e) => (
        <div key={e.id} className="flex items-center justify-between border-b border-[#f2f4f7] py-2 text-[13px] last:border-b-0">
          <span className="flex items-center gap-2 text-foreground">
            {e.vendor ? `${e.vendor} — ${e.category}` : e.category}
            {e.receipt_path && (
              <a
                href={publicUrl(e.receipt_path)}
                target="_blank"
                rel="noreferrer"
                className="text-[11.5px] font-semibold text-electric"
              >
                Bon
              </a>
            )}
          </span>
          <span className="font-bold text-[#344054]">
            {Number(e.amount).toFixed(2)} {e.currency}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-[#f2f4f7] pt-2.5">
        <span className="text-[13px] font-bold text-foreground">Total</span>
        <span className="text-[14px] font-extrabold text-foreground">{total.toFixed(2)} RON</span>
      </div>
    </>
  );
}

function ChecklistPreview({
  items,
  jobId,
}: {
  items: { id: string; label: string; is_checked: boolean }[];
  jobId: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Fără checklist încă.{" "}
        <Link href={`/lucrari/${jobId}?tab=checklist`} className="font-semibold text-electric">
          Adaugă elemente →
        </Link>
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.slice(0, 6).map((item) => (
        <div key={item.id} className="flex items-center gap-2.5 text-[13px]">
          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.is_checked ? "bg-success text-white" : "border-2 border-[#d0d5dd]"}`}>
            {item.is_checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </div>
          <span className={item.is_checked ? "text-[#344054]" : "text-muted"}>{item.label}</span>
        </div>
      ))}
      {items.length > 6 && (
        <Link href={`/lucrari/${jobId}?tab=checklist`} className="text-[12px] font-semibold text-electric">
          Vezi toate ({items.length}) →
        </Link>
      )}
    </div>
  );
}

function ReportCard({ jobId, full }: { jobId: string; full?: boolean }) {
  return (
    <Card title="Raport automat">
      <div className="flex items-center gap-3 rounded-[10px] border border-[#eaecf0] bg-[#f9fafb] p-3.5">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-danger-bg">
          <FileText className="h-[18px] w-[18px] text-danger" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-foreground">Raport de intervenție</div>
          <div className="text-[11.5px] text-muted-2">Generat automat pe baza datelor completate</div>
        </div>
      </div>
      <Link
        href={`/api/rapoarte-lucrare/${jobId}`}
        className="mt-3 flex items-center justify-center rounded-[10px] bg-electric py-3 text-[13.5px] font-bold text-white"
      >
        Descarcă PDF
      </Link>
      {full && (
        <p className="mt-3 text-[12px] text-muted">
          Raportul se deschide într-o pagină nouă, gata de printat sau salvat ca PDF (Ctrl/Cmd+P → „Salvează ca PDF”).
        </p>
      )}
    </Card>
  );
}

function SignatureCard({
  signature,
  publicUrl,
}: {
  signature: { signer_name: string; storage_path: string; signed_at: string } | null;
  publicUrl: (path: string) => string;
}) {
  return (
    <Card title="Semnătură client">
      {signature ? (
        <>
          <div className="flex h-[90px] items-center justify-center rounded-[10px] border border-[#f2f4f7] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicUrl(signature.storage_path)} alt="Semnătură client" className="h-full object-contain" />
          </div>
          <div className="mt-2 text-[12px] text-muted-2">
            Semnat de {signature.signer_name}, {new Date(signature.signed_at).toLocaleString("ro-RO")}
          </div>
        </>
      ) : (
        <div className="flex h-[90px] items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[#d0d5dd] text-[12.5px] text-muted">
          Fără semnătură încă
        </div>
      )}
    </Card>
  );
}

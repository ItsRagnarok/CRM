import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  JOB_TYPE_LABELS,
} from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";
import { Briefcase, Plus, Calendar, ArrowLeft } from "lucide-react";
import { todayInOrgTimeZone } from "@/lib/date";
import { DOMAINS, domainLabel } from "@/lib/domains";

type JobStatus = Database["public"]["Enums"]["job_status"];

// Filters as in the platform mockup. "Blocate" = jobs that need attention;
// "De facturat" = finished jobs the field sent to the office for invoicing.
const WORKING: JobStatus[] = ["in_drum", "ajunsa", "in_lucru", "pauza"];
const FILTERS = [
  { id: "toate", label: "Toate" },
  { id: "lucru", label: "În lucru" },
  { id: "programate", label: "Programate" },
  { id: "blocate", label: "Blocate" },
  { id: "facturat", label: "De facturat" },
  { id: "finalizate", label: "Finalizate luna asta" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];
const PERIODS = [
  { id: "toate", label: "Toate perioadele" },
  { id: "luna", label: "Luna aceasta" },
  { id: "saptamana", label: "Săptămâna aceasta" },
] as const;
const DOMAIN_CHIP: Record<string, string> = { electric: "E", gaze: "G", fotovoltaic: "PV" };
const lei = (n: number) => n.toLocaleString("ro-RO", { maximumFractionDigits: 0 });

export default async function LucrariPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; clientId?: string; domeniu?: string; echipa?: string; perioada?: string }>;
}) {
  const sp = await searchParams;
  const filter: FilterId = FILTERS.find((f) => f.id === sp.f)?.id ?? "toate";
  const period = PERIODS.find((p) => p.id === sp.perioada)?.id ?? "toate";
  const domain = DOMAINS.find((d) => d.id === sp.domeniu)?.id ?? "";
  const clientId = sp.clientId;
  const teamId = sp.echipa && /^[0-9a-f-]{36}$/i.test(sp.echipa) ? sp.echipa : "";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const weekStart = new Date(Date.parse(`${today}T00:00:00Z`) - dow * 86_400_000).toISOString().slice(0, 10);

  const [{ data: all }, { data: client }, { data: teams }, { data: billing }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, display_number, title, job_type, status, domain, team_id, client_id, scheduled_date, start_time, end_time, work_ended_at, clients(name), locations(address), teams(name), job_assignments(profiles(full_name))")
      .eq("organization_id", organization.id)
      .order("scheduled_date", { ascending: false })
      .limit(1500),
    clientId ? supabase.from("clients").select("id, name").eq("id", clientId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("teams").select("id, name").eq("organization_id", organization.id).order("name"),
    supabase.from("billing_requests").select("job_id").eq("organization_id", organization.id).eq("status", "new"),
    supabase.from("invoices").select("job_id, total_amount").eq("organization_id", organization.id),
  ]);

  const toInvoice = new Set((billing ?? []).map((b) => b.job_id).filter((id): id is string => Boolean(id)));
  const value = new Map<string, number>();
  for (const i of invoices ?? []) if (i.job_id) value.set(i.job_id, (value.get(i.job_id) ?? 0) + Number(i.total_amount ?? 0));

  // Everything except the chip filter, so the chip counts stay meaningful.
  const base = (all ?? []).filter((j) => {
    if (clientId && j.client_id !== clientId) return false;
    if (domain && j.domain !== domain) return false;
    if (teamId && j.team_id !== teamId) return false;
    if (period === "luna" && j.scheduled_date < monthStart) return false;
    if (period === "saptamana" && j.scheduled_date < weekStart) return false;
    return true;
  });
  const matches: Record<FilterId, (j: (typeof base)[number]) => boolean> = {
    toate: () => true,
    lucru: (j) => WORKING.includes(j.status),
    programate: (j) => j.status === "programata",
    blocate: (j) => j.status === "necesita_atentie",
    facturat: (j) => toInvoice.has(j.id),
    finalizate: (j) => j.status === "finalizata" && j.scheduled_date >= monthStart,
  };
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, base.filter(matches[f.id]).length])) as Record<FilterId, number>;
  const jobs = base.filter(matches[filter]);

  const href = (over: Record<string, string>) => {
    const params = new URLSearchParams();
    const cur: Record<string, string> = { f: filter === "toate" ? "" : filter, domeniu: domain, echipa: teamId, perioada: period === "toate" ? "" : period, clientId: clientId ?? "" };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v) params.set(k, v);
    return params.toString() ? `/lucrari?${params}` : "/lucrari";
  };
  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${on ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground">Lucrări</h1>
          {client && (
            <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
              Filtrat pentru <span className="font-semibold text-foreground">{client.name}</span>
              <Link href="/lucrari" className="flex items-center gap-1 font-semibold text-electric"><ArrowLeft className="h-3 w-3" /> vezi toate</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/calendar" className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"><Calendar className="h-3.5 w-3.5" /> Vezi în calendar</Link>
          <Link href={clientId ? `/lucrari/nou?clientId=${clientId}` : "/lucrari/nou"} className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold"><Plus className="h-4 w-4" /> Lucrare nouă</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => <Link key={f.id} href={href({ f: f.id === "toate" ? "" : f.id })} className={chip(filter === f.id)}>{f.label} · {counts[f.id]}</Link>)}
      </div>

      <form method="get" action="/lucrari" className="flex flex-wrap items-center gap-2">
        {filter !== "toate" && <input type="hidden" name="f" value={filter} />}
        {clientId && <input type="hidden" name="clientId" value={clientId} />}
        <select name="domeniu" defaultValue={domain} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold" aria-label="Domeniu">
          <option value="">Domeniu: Toate</option>
          {DOMAINS.filter((d) => (organization.enabled_domains ?? []).includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <select name="echipa" defaultValue={teamId} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold" aria-label="Echipă">
          <option value="">Echipă: Toate</option>
          {(teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select name="perioada" defaultValue={period} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold" aria-label="Perioadă">
          {PERIODS.map((p) => <option key={p.id} value={p.id === "toate" ? "" : p.id}>Perioadă: {p.label}</option>)}
        </select>
        <button className="rounded-full bg-[#1f2024] px-4 py-1.5 text-[13px] font-bold text-white">Aplică</button>
        {(domain || teamId || period !== "toate") && <Link href={href({ domeniu: "", echipa: "", perioada: "" })} className="text-[13px] font-semibold text-electric">Șterge filtrele</Link>}
      </form>

      {jobs.length > 0 ? (
        <div className="overflow-x-auto rounded-[13px] border border-border bg-white">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Lucrare</th><th className="px-3 py-3">Domeniu</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Echipă</th><th className="px-3 py-3">Data</th><th className="px-3 py-3">Etapă</th><th className="px-3 py-3 text-right">Valoare</th><th className="px-5 py-3">Stare</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
                const v = value.get(job.id);
                return (
                  <tr key={job.id} className="border-t border-[#f2f4f7] align-top hover:bg-[#f9fafb]">
                    <td className="px-5 py-3.5">
                      <Link href={`/lucrari/${job.id}`} prefetch={false} className="text-[13.5px] font-bold text-foreground hover:underline">#{job.display_number} · {job.title}</Link>
                      <div className="text-[12px] text-muted-2">{job.locations?.address ?? JOB_TYPE_LABELS[job.job_type]}</div>
                    </td>
                    <td className="px-3 py-3.5">{job.domain ? <span title={domainLabel(job.domain)} className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[7px] bg-[#0f172a] px-1 text-[10.5px] font-extrabold text-[#c6ff4a]">{DOMAIN_CHIP[job.domain] ?? "—"}</span> : <span className="text-muted-2">—</span>}</td>
                    <td className="px-3 py-3.5 text-[13px] font-semibold text-foreground">{job.clients?.name ?? "—"}</td>
                    <td className="px-3 py-3.5 text-[13px] text-[#344054]">{job.teams?.name ? <><div className="font-bold text-foreground">{job.teams.name}</div>{assignees.length > 0 && <div className="text-[11.5px] text-muted-2">{assignees.join(", ")}</div>}</> : "neasignată"}</td>
                    <td className="px-3 py-3.5 text-[13px] tabular-nums text-[#344054]">{new Date(`${job.scheduled_date}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit" })}{job.start_time ? ` · ${job.start_time.slice(0, 5)}` : ""}</td>
                    <td className="px-3 py-3.5 text-[12.5px] text-[#344054]">{toInvoice.has(job.id) ? "De facturat" : job.status === "finalizata" ? "Predată" : WORKING.includes(job.status) ? "Execuție" : job.status === "programata" ? "Programată" : JOB_STATUS_LABELS[job.status]}</td>
                    <td className="px-3 py-3.5 text-right text-[13px] tabular-nums">{v ? lei(v) : "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge label={JOB_STATUS_LABELS[job.status]} className={JOB_STATUS_STYLES[job.status]} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={all && all.length ? "Nicio lucrare pentru filtrele alese" : "Nicio lucrare încă"}
          description={all && all.length ? "Încearcă alt filtru sau șterge filtrele." : "Creează prima lucrare pentru a începe să urmărești programările echipei."}
          action={!(all && all.length) && <Link href="/lucrari/nou" className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold"><Plus className="h-4 w-4" /> Lucrare nouă</Link>}
        />
      )}
    </div>
  );
}

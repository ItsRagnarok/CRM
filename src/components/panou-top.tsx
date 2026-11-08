import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { KIND_LABELS, complianceLevel, daysUntil, type ComplianceKind } from "@/lib/compliance";
import { syncComplianceAlerts } from "@/lib/compliance-alerts";
import { openClocks } from "@/lib/pv";
import type { SessionContext } from "@/lib/auth";

type SessionOrganization = SessionContext["organization"];

type Props = { organization: SessionOrganization; today: string; canAlert: boolean };
const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;
const daysAgo = (iso: string, today: string) => Math.max(0, -daysUntil(iso.slice(0, 10), today));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Attention = { key: string; tone: "bad" | "warn" | "info"; title: string; sub: string; href: string; action: string; rank: number };

// Top of the dashboard as in the platform mockup: five numbers and "what needs attention now".
export async function PanouTop({ organization, today, canAlert }: Props) {
  const supabase = await createClient();
  const orgId = organization.id;
  const modules = organization.enabled_modules ?? [];
  const head = { count: "exact" as const, head: true };
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000).toISOString().slice(0, 10);
  const hasCompliance = hasModule(modules, "conformitate");
  const hasPv = hasModule(modules, "dosar_fotovoltaic");
  const hasGas = hasModule(modules, "scadentar_gaze");

  if (hasCompliance && canAlert) await syncComplianceAlerts(supabase, orgId, today);

  const [jobsToday, billing, invoices, compliance, pv, gas, attentionJobs, purchases] = await Promise.all([
    supabase.from("jobs").select("status").eq("organization_id", orgId).eq("scheduled_date", today),
    supabase.from("billing_requests").select("created_at").eq("organization_id", orgId).eq("status", "new").order("created_at").limit(500),
    supabase.from("invoices").select("total_amount, client_id, due_date, issued_at, status").eq("organization_id", orgId).in("status", ["unpaid", "overdue"]).limit(2000),
    hasCompliance
      ? supabase.from("compliance_items").select("id, kind, title, subject, expires_on").eq("organization_id", orgId).lte("expires_on", horizon).order("expires_on").limit(200)
      : Promise.resolve({ data: [] as { id: string; kind: ComplianceKind; title: string; subject: string; expires_on: string }[] }),
    hasPv
      ? supabase.from("pv_projects").select("id, name, stage, atr_filed_on, atr_received_on, cert_requested_on, cert_received_on, afm_filed_on, afm_paid_on").eq("organization_id", orgId).neq("stage", "anulat").neq("stage", "finalizat").limit(500)
      : Promise.resolve({ data: [] }),
    hasGas ? supabase.rpc("gas_overdue_count", { p_today: today }) : Promise.resolve({ data: 0 }),
    supabase.from("jobs").select("id, display_number, title").eq("organization_id", orgId).eq("status", "necesita_atentie").limit(5),
    supabase.from("purchase_requests").select("id", head).eq("organization_id", orgId).eq("status", "pending"),
  ]);

  // Jobs today
  const st = (jobsToday.data ?? []).map((j) => j.status);
  const working = st.filter((s) => ["in_drum", "ajunsa", "in_lucru", "pauza"].includes(s)).length;
  const planned = st.filter((s) => s === "programata").length;
  const done = st.filter((s) => s === "finalizata").length;
  // To invoice
  const toInvoice = billing.data ?? [];
  const oldestBilling = toInvoice[0] ? daysAgo(toInvoice[0].created_at, today) : null;
  // Overdue receivables
  const open = invoices.data ?? [];
  const owed = open.reduce((a, i) => a + Number(i.total_amount ?? 0), 0);
  const owedClients = new Set(open.map((i) => i.client_id)).size;
  const oldestDue = open.map((i) => i.due_date ?? i.issued_at).filter(Boolean).sort()[0];
  // Expiring
  const expiring = (compliance.data ?? []).map((c) => ({ ...c, left: daysUntil(c.expires_on, today) }));
  const byKind = (Object.keys(KIND_LABELS) as ComplianceKind[]).map((k) => [k, expiring.filter((c) => c.kind === k).length] as const).filter(([, n]) => n > 0);
  // PV clocks
  const pvLate = (pv.data ?? []).map((p) => ({ p, clocks: openClocks(p, { atrDays: organization.pv_atr_days, certDays: organization.pv_cert_days }, today).filter((c) => c.overdue) })).filter((x) => x.clocks.length);
  // Gas
  const gasLate = Number(gas.data ?? 0);

  const items: Attention[] = [];
  for (const { p, clocks } of pvLate) {
    const c = clocks[0];
    items.push({ key: `pv-${p.id}`, tone: "bad", rank: 0, title: `${c.label.split(" (")[0]} depus de ${c.elapsed} zile, fără răspuns`, sub: `${p.name} · termenul de ${c.termDays} zile a fost depășit · mesaj pregătit pentru operator`, href: `/fotovoltaic/${p.id}`, action: "Deschide dosarul" });
  }
  for (const c of expiring.filter((e) => e.left <= 7).slice(0, 4)) {
    items.push({ key: `c-${c.id}`, tone: "bad", rank: c.left < 0 ? 0 : 1, title: c.left < 0 ? `${c.title} a expirat` : `${c.title} expiră în ${c.left} zile`, sub: c.subject, href: "/conformitate", action: "Reînnoiește" });
  }
  for (const j of attentionJobs.data ?? []) {
    items.push({ key: `j-${j.id}`, tone: "warn", rank: 2, title: `Lucrarea #${j.display_number} necesită atenție`, sub: j.title, href: `/lucrari/${j.id}`, action: "Deschide" });
  }
  if ((purchases.count ?? 0) > 0) items.push({ key: "buy", tone: "warn", rank: 3, title: `${plural(purchases.count ?? 0, "cerere", "cereri")} de achiziție ${purchases.count === 1 ? "așteaptă" : "așteaptă"} aprobare`, sub: "din teren", href: "/aprobari", action: "Aprobă" });
  if (toInvoice.length > 0) items.push({ key: "bill", tone: "info", rank: 4, title: `${plural(toInvoice.length, "lucrare închisă", "lucrări închise")}, de facturat`, sub: oldestBilling !== null ? `cea mai veche așteaptă de ${plural(oldestBilling, "zi", "zile")}` : "", href: "/facturare", action: "Facturează" });
  if (gasLate > 0) items.push({ key: "gas", tone: "warn", rank: 3, title: `${plural(gasLate, "apartament", "apartamente")} cu scadența depășită`, sub: "verificare sau revizie de gaze", href: "/gaze", action: "Deschide" });
  for (const c of expiring.filter((e) => e.left > 7 && e.left <= 30).slice(0, 2)) {
    items.push({ key: `c-${c.id}`, tone: "warn", rank: 5, title: `${c.title} expiră în ${c.left} zile`, sub: c.subject, href: "/conformitate", action: "Vezi" });
  }
  items.sort((a, b) => a.rank - b.rank);
  const shown = items.slice(0, 8);

  const tone: Record<Attention["tone"], string> = { bad: "bg-[#dc2626]", warn: "bg-[#f59e0b]", info: "bg-[#c6ff4a] ring-1 ring-[#84a31f]" };
  const Kpi = ({ label, value, sub, cls = "" }: { label: string; value: string | number; sub: string; cls?: string }) => (
    <div className={`rounded-2xl border bg-white px-[18px] py-4 ${cls || "border-border"}`}>
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-1 text-[30px] font-extrabold leading-none tracking-tight tabular-nums text-foreground">{value}</div>
      <div className="mt-1.5 text-[12px] text-muted">{sub}</div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Lucrări azi" value={st.length} sub={`${working} în lucru · ${planned} programate · ${done} finalizate`} />
        <Kpi label="De facturat" value={toInvoice.length} sub={oldestBilling !== null ? `cea mai veche: ${plural(oldestBilling, "zi", "zile")}` : "nimic de facturat"} cls={toInvoice.length ? "border-[#f5c27a] bg-[#fffaf0]" : ""} />
        <Kpi label="Încasări restante" value={lei(owed)} sub={open.length ? `${plural(owedClients, "client", "clienți")} · cea mai veche: ${oldestDue ? plural(daysAgo(oldestDue, today), "zi", "zile") : "—"}` : "nicio factură neîncasată"} cls={owed > 0 ? "border-[#f5c27a] bg-[#fffaf0]" : ""} />
        {hasCompliance && <Kpi label="Expiră în 30 de zile" value={expiring.length} sub={byKind.length ? byKind.map(([k, n]) => `${n} ${KIND_LABELS[k].toLowerCase()}`).join(" · ") : "nimic nu expiră"} cls={expiring.some((c) => complianceLevel(c.left) === "expired") ? "border-[#f0a3a3] bg-[#fff5f5]" : ""} />}
        {hasPv && <Kpi label="Termene operator depășite" value={pvLate.length} sub={pvLate.length ? pvLate.map(({ clocks }) => `${clocks[0].key === "atr" ? "ATR" : "certificat"} ${clocks[0].elapsed} zile`).slice(0, 2).join(" · ") : "în termen"} cls={pvLate.length ? "border-[#f0a3a3] bg-[#fff5f5]" : ""} />}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground">Ce cere atenția acum</h2>
          <span className="text-[12.5px] font-semibold text-muted">{items.length ? `${items.length} ${items.length === 1 ? "lucru" : "lucruri"}` : ""}</span>
        </div>
        {shown.length === 0 ? (
          <p className="py-3 text-[13.5px] text-muted">Nimic urgent. Scadențele, termenele operatorului, cererile și facturile sunt la zi.</p>
        ) : (
          <ul className="divide-y divide-[#eef0f4]">
            {shown.map((i) => (
              <li key={i.key} className="flex items-center gap-3 py-3 text-[13.5px]">
                <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${tone[i.tone]}`} aria-hidden />
                <span className="min-w-0 flex-1"><b className="block font-bold">{i.title}</b>{i.sub && <span className="block truncate text-[12px] text-muted">{i.sub}</span>}</span>
                <Link href={i.href} className="shrink-0 rounded-[10px] bg-electric px-3.5 py-2 text-[12.5px] font-extrabold">{i.action}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

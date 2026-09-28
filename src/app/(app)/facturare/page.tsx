import { Plus, FileText } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { createInvoiceForJob, markInvoicePaid } from "./actions";

const STATUS_LABEL: Record<string, string> = { unpaid: "Neplătită", paid: "Plătită", overdue: "Restantă" };
const STATUS_STYLE: Record<string, string> = {
  unpaid: "bg-warning-bg text-warning",
  paid: "bg-success-bg text-success",
  overdue: "bg-danger-bg text-danger",
};

export default async function FacturarePage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [{ data: invoices }, { data: jobs }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, status, issued_at, clients(name), jobs(display_number)")
      .eq("organization_id", organization.id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, display_number, title, clients(name)")
      .eq("organization_id", organization.id)
      .order("scheduled_date", { ascending: false })
      .limit(50),
  ]);

  const facturatLunaAceasta = (invoices ?? [])
    .filter((i) => i.issued_at >= monthStartStr)
    .reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
  const neplatite = (invoices ?? [])
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
  const restante = (invoices ?? [])
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
  const incasatLunaAceasta = (invoices ?? [])
    .filter((i) => i.status === "paid" && i.issued_at >= monthStartStr)
    .reduce((s, i) => s + Number(i.total_amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5 p-7">
      <h1 className="text-[17px] font-extrabold text-foreground">Facturare</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">Facturi emise</div>
          {invoices && invoices.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Nr.</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Lucrare</th>
                  <th className="px-5 py-3">Emisă</th>
                  <th className="px-5 py-3 text-right">Valoare</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-[#f2f4f7]">
                    <td className="px-5 py-3 text-[13px] font-bold text-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-[13px] text-[#344054]">{inv.clients?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {inv.jobs ? (
                        <span className="text-[13px] font-bold text-electric">#{inv.jobs.display_number}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">
                      {new Date(`${inv.issued_at}T00:00:00`).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right text-[13.5px] font-bold text-foreground">
                      {Number(inv.total_amount).toFixed(2)} RON
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={STATUS_LABEL[inv.status] ?? inv.status}
                        className={STATUS_STYLE[inv.status] ?? "bg-neutral-bg text-neutral"}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.status !== "paid" && (
                        <form action={markInvoicePaid}>
                          <input type="hidden" name="invoiceId" value={inv.id} />
                          <button type="submit" className="text-[12px] font-bold text-success">
                            Marchează plătită
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState icon={FileText} title="Nicio factură emisă" description="Generează prima factură din panoul alăturat." />
            </div>
          )}
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <div className="mb-3.5 text-[14.5px] font-bold text-foreground">Generează factură</div>
          {jobs && jobs.length > 0 ? (
            <form action={createInvoiceForJob} className="flex flex-col gap-2.5">
              <select
                name="jobId"
                required
                defaultValue=""
                className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
              >
                <option value="" disabled>
                  Alege o lucrare…
                </option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    #{j.display_number} — {j.clients?.name ?? "client necunoscut"} · {j.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="laborAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Manoperă"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="materialsAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Materiale"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="travelAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Deplasare"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="otherAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Altele"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
              </div>
              <button
                type="submit"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
              >
                <Plus className="h-4 w-4" /> Generează factură
              </button>
              <p className="mt-1 rounded-[9px] bg-neutral-bg p-2.5 text-[11.5px] leading-relaxed text-muted-2">
                Pregătit pentru integrare cu soluții externe de facturare/contabilitate (ex. SmartBill, Oblio, FGO).
              </p>
            </form>
          ) : (
            <p className="text-[13px] text-muted">Creează mai întâi o lucrare pentru a putea emite o factură.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Facturat luna aceasta" value={`${facturatLunaAceasta.toFixed(0)} RON`} />
        <StatCard label="Neplătite" value={`${neplatite.toFixed(0)} RON`} color="text-warning" />
        <StatCard label="Restante" value={`${restante.toFixed(0)} RON`} color="text-danger" />
        <StatCard label="Încasat luna aceasta" value={`${incasatLunaAceasta.toFixed(0)} RON`} color="text-success" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-[13px] border border-border bg-white px-[18px] py-4">
      <div className={`text-[12.5px] font-semibold ${color ?? "text-muted"}`}>{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}

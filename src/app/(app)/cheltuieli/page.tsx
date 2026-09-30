import Link from "next/link";
import { Receipt, Fuel, ParkingCircle, Wrench } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrls } from "@/lib/storage";
import { EmptyState } from "@/components/empty-state";
import { approveExpense, rejectExpense } from "./actions";
import { todayInOrgTimeZone } from "@/lib/date";

const STATUS_TABS = [
  { value: "pending", label: "În așteptare", bg: "#FEF3C7", color: "#B45309" },
  { value: "approved", label: "Aprobate", bg: "#DCFCE7", color: "#15803D" },
  { value: "rejected", label: "Respinse", bg: "#FEE2E2", color: "#B91C1C" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  rejected: "Respinsă",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

const CATEGORY_ICON: Record<string, { icon: typeof Fuel; bg: string; color: string }> = {
  materiale: { icon: Wrench, bg: "#FEF3F2", color: "#B91C1C" },
  combustibil: { icon: Fuel, bg: "#FEF9EC", color: "#B45309" },
  parcare: { icon: ParkingCircle, bg: "#EFF4FF", color: "#2F6FED" },
};

export default async function CheltuieliPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const monthStartStr = `${todayInOrgTimeZone().slice(0, 7)}-01`;

  const [{ data: expenses }, { data: allExpenses }] = await Promise.all([
    (() => {
      let query = supabase
        .from("expenses")
        .select(
          "id, category, amount, vendor, expense_date, status, rejection_reason, receipt_path, jobs(display_number, title), profiles!expenses_submitted_by_fkey(full_name)"
        )
        .eq("organization_id", organization.id);
      if (status) query = query.eq("status", status);
      return query.order("expense_date", { ascending: false });
    })(),
    supabase.from("expenses").select("status, amount, expense_date").eq("organization_id", organization.id),
  ]);

  const statusCounts = new Map<string, number>();
  for (const e of allExpenses ?? []) {
    statusCounts.set(e.status, (statusCounts.get(e.status) ?? 0) + 1);
  }
  const totalThisMonth = (allExpenses ?? [])
    .filter((e) => e.expense_date >= monthStartStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const receiptUrls = await signedAttachmentUrls(supabase, (expenses ?? []).map((e) => e.receipt_path));
  const statusHref = (s: string) => (s ? `/cheltuieli?status=${s}` : "/cheltuieli");

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-extrabold text-foreground">Cheltuieli</h1>
        <div className="text-[13px] text-muted">
          Total luna aceasta: <b className="text-foreground">{totalThisMonth.toFixed(2)} RON</b>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={statusHref("")}
          prefetch={false}
          className={`rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold ${
            !status ? "bg-[#101828] text-white" : "bg-neutral-bg text-[#475467]"
          }`}
        >
          Toate ({allExpenses?.length ?? 0})
        </Link>
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value}
            href={statusHref(t.value)}
            prefetch={false}
            className="rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold"
            style={
              status === t.value
                ? { background: "#101828", color: "#fff" }
                : { background: t.bg, color: t.color }
            }
          >
            {t.label} ({statusCounts.get(t.value) ?? 0})
          </Link>
        ))}
      </div>

      {expenses && expenses.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Bon</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">Lucrare</th>
                <th className="px-5 py-3">Tehnician</th>
                <th className="px-5 py-3">Dată</th>
                <th className="px-5 py-3 text-right">Sumă</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const cat = CATEGORY_ICON[e.category] ?? CATEGORY_ICON.materiale;
                const Icon = cat.icon;
                return (
                  <tr key={e.id} className="border-t border-[#f2f4f7]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
                          style={{ background: cat.bg }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground">{e.vendor ?? "—"}</span>
                        {e.receipt_path && (
                          <a
                            href={receiptUrls.get(e.receipt_path) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-electric"
                          >
                            Bon
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] capitalize text-[#344054]">{e.category}</td>
                    <td className="px-5 py-3">
                      {e.jobs ? (
                        <span className="text-[13px] font-bold text-electric">#{e.jobs.display_number}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#344054]">
                      {e.profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">
                      {new Date(`${e.expense_date}T00:00:00`).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right text-[13.5px] font-bold text-foreground">
                      {Number(e.amount).toFixed(2)} RON
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[e.status]}`}
                      >
                        {STATUS_LABEL[e.status] ?? e.status}
                      </span>
                      {e.status === "rejected" && e.rejection_reason && (
                        <div className="mt-1 text-[11px] text-muted-2">{e.rejection_reason}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {e.status === "pending" && (
                        <div className="flex items-center justify-end gap-3">
                          <form action={approveExpense}>
                            <input type="hidden" name="expenseId" value={e.id} />
                            <button type="submit" className="text-[12px] font-bold text-success">
                              Aprobă
                            </button>
                          </form>
                          <details className="relative">
                            <summary className="cursor-pointer text-[12px] font-bold text-danger">
                              Respinge
                            </summary>
                            <form
                              action={rejectExpense}
                              className="absolute right-0 z-10 mt-2 flex w-56 flex-col gap-2 rounded-[10px] border border-border bg-white p-3 shadow-lg"
                            >
                              <input type="hidden" name="expenseId" value={e.id} />
                              <input
                                name="reason"
                                placeholder="Motiv (opțional)"
                                className="rounded-[8px] border border-[#d0d5dd] px-2.5 py-1.5 text-[12px] outline-none focus:border-electric"
                              />
                              <button
                                type="submit"
                                className="rounded-[8px] bg-danger px-3 py-1.5 text-[12px] font-bold text-white"
                              >
                                Confirmă respingerea
                              </button>
                            </form>
                          </details>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="Nicio cheltuială înregistrată"
          description="Cheltuielile trimise de tehnicieni din aplicația mobilă vor apărea aici, spre aprobare."
        />
      )}
    </div>
  );
}

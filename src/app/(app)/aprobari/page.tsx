import Link from "next/link";
import { ClipboardCheck, Check, X } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { decidePurchaseRequest } from "../lucrari/[id]/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  denied: "Respinsă",
};
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#fef9ec] text-[#b45309]",
  approved: "bg-success-bg text-success",
  denied: "bg-danger-bg text-danger",
};

export default async function AprobariPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "toate" ? "toate" : "pending";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("purchase_requests")
    .select(
      "id, quantity, custom_name, note, status, created_at, decided_at, materials(name, unit), jobs(id, display_number, title), requester:profiles!purchase_requests_requested_by_fkey(full_name)"
    )
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  const rows = (requests ?? []).filter((r) => (tab === "pending" ? r.status === "pending" : true));
  const pendingCount = (requests ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-extrabold text-foreground">Aprobări cumpărare</h1>
        <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          <Link
            href="/aprobari"
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-bold ${
              tab === "pending" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            În așteptare {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Link>
          <Link
            href="/aprobari?tab=toate"
            className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-bold ${
              tab === "toate" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Toate
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nimic de aprobat"
          description="Cererile tehnicienilor de a cumpăra materiale sau scule lipsă apar aici."
        />
      ) : (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="flex flex-col divide-y divide-[#f2f4f7]">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold text-foreground">
                    {r.materials?.name ?? r.custom_name} — {r.quantity} {r.materials?.unit ?? "buc"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-2">
                    {r.requester?.full_name ?? "—"} · lucrarea{" "}
                    {r.jobs ? (
                      <Link href={`/lucrari/${r.jobs.id}`} className="font-semibold text-electric">
                        #{r.jobs.display_number} — {r.jobs.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {r.note ? ` · „${r.note}”` : ""}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
                {r.status === "pending" && (
                  <div className="flex gap-1.5">
                    <form action={decidePurchaseRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-success-bg text-success"
                        aria-label="Aprobă"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={decidePurchaseRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="decision" value="denied" />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-danger-bg text-danger"
                        aria-label="Respinge"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

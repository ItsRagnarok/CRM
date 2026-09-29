import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { setStockQuantity } from "./actions";

const STATUS_DOT: Record<string, string> = {
  ok: "🟢",
  scazut: "🟠",
  critic: "🔴",
};

export default async function MaterialePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: warehouse }, { data: materials }] = await Promise.all([
    supabase
      .from("warehouses")
      .select("id, name")
      .eq("organization_id", organization.id)
      .eq("is_central", true)
      .maybeSingle(),
    (() => {
      let query = supabase
        .from("materials")
        .select("id, name, category, unit, min_stock, material_stock(quantity, warehouse_id)")
        .eq("organization_id", organization.id);
      if (q) query = query.ilike("name", `%${q}%`);
      return query.order("category").order("name");
    })(),
  ]);

  const warehouseId = warehouse?.id;

  const rows = (materials ?? []).map((m) => {
    const quantity = m.material_stock.find((s) => s.warehouse_id === warehouseId)?.quantity ?? 0;
    const status: "ok" | "scazut" | "critic" =
      quantity >= m.min_stock ? "ok" : quantity >= m.min_stock * 0.5 ? "scazut" : "critic";
    return { ...m, quantity, status };
  });

  const total = rows.length;
  const okCount = rows.filter((r) => r.status === "ok").length;
  const lowCount = rows.filter((r) => r.status === "scazut").length;
  const criticalCount = rows.filter((r) => r.status === "critic").length;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-extrabold text-foreground">Materiale &amp; Stoc</h1>

        <form className="flex max-w-[320px] flex-1 items-center gap-2 rounded-[10px] bg-neutral-bg px-3.5 py-2.5">
          <Search className="h-3.5 w-3.5 text-muted-2" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută material…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
          />
        </form>

        <div className="flex-1" />

        <Link
          href="/materiale/comanda"
          className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13px] font-bold text-[#344054]"
        >
          Comandă furnizor
        </Link>
        <Link
          href="/materiale/nou"
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Material
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Materiale în stoc" value={total} />
        <StatCard label="🟢 Stoc OK" value={okCount} color="text-success" />
        <StatCard label="🟠 Stoc scăzut" value={lowCount} color="text-warning" />
        <StatCard label="🔴 Stoc critic" value={criticalCount} color="text-danger" />
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">
            {warehouse?.name ?? "Depozit central"}
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Material</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">Stoc total</th>
                <th className="px-5 py-3">Stoc minim</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#f2f4f7]">
                  <td className="px-5 py-3 text-[13.5px] font-bold text-foreground">{r.name}</td>
                  <td className="px-5 py-3 text-[13px] text-muted">{r.category ?? "—"}</td>
                  <td className="px-5 py-3">
                    {warehouseId ? (
                      <form
                        action={setStockQuantity.bind(null, r.id, `warehouse:${warehouseId}`)}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="number"
                          name="quantity"
                          min={0}
                          defaultValue={r.quantity}
                          className="w-[70px] rounded-[7px] border border-[#d0d5dd] px-2 py-1 text-[13px] outline-none focus:border-electric"
                        />
                        <span className="text-[12px] text-muted-2">{r.unit}</span>
                        <button type="submit" className="text-[11px] font-bold text-electric">
                          Salvează
                        </button>
                      </form>
                    ) : (
                      <span className="text-[13px]">
                        {r.quantity} {r.unit}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-2">
                    {r.min_stock} {r.unit}
                  </td>
                  <td className="px-5 py-3 text-[13px]">{STATUS_DOT[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Niciun material găsit"
          description={q ? "Încearcă altă căutare." : "Adaugă primul material pentru a începe."}
          action={
            !q && (
              <Link
                href="/materiale/nou"
                className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
              >
                <Plus className="h-4 w-4" /> Material
              </Link>
            )
          }
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[13px] border border-border bg-white px-[18px] py-4">
      <div className={`text-[12.5px] font-semibold ${color ?? "text-muted"}`}>{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export default async function ComandaFurnizorPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: warehouse } = await supabase
    .from("warehouses")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("is_central", true)
    .maybeSingle();

  const { data: materials } = await supabase
    .from("materials")
    .select("id, name, category, unit, min_stock, material_stock(quantity, warehouse_id)")
    .eq("organization_id", organization.id)
    .order("category")
    .order("name");

  const shortages = (materials ?? [])
    .map((m) => {
      const quantity = m.material_stock.find((s) => s.warehouse_id === warehouse?.id)?.quantity ?? 0;
      return { ...m, quantity, suggested: Math.max(0, m.min_stock * 2 - quantity) };
    })
    .filter((m) => m.quantity < m.min_stock);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/materiale"
            className="no-print flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
          >
            <ArrowLeft className="h-4 w-4 text-[#344054]" />
          </Link>
          <h1 className="text-[17px] font-extrabold text-foreground">
            Comandă furnizor — sub stoc minim
          </h1>
        </div>
        <PrintButton />
      </div>

      {shortages.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-white p-8 text-center text-[13.5px] text-muted">
          Niciun material sub stocul minim. Nu e nevoie de comandă acum.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Material</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">Stoc actual</th>
                <th className="px-5 py-3">Stoc minim</th>
                <th className="px-5 py-3">Cantitate sugerată</th>
              </tr>
            </thead>
            <tbody>
              {shortages.map((m) => (
                <tr key={m.id} className="border-t border-[#f2f4f7]">
                  <td className="px-5 py-3 text-[13.5px] font-bold text-foreground">{m.name}</td>
                  <td className="px-5 py-3 text-[13px] text-muted">{m.category ?? "—"}</td>
                  <td className="px-5 py-3 text-[13px]">
                    {m.quantity} {m.unit}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-2">
                    {m.min_stock} {m.unit}
                  </td>
                  <td className="px-5 py-3 text-[13px] font-bold text-electric">
                    {m.suggested} {m.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

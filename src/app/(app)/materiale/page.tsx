import Link from "next/link";
import { Package, Plus, Search, Download } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { setStockQuantity, importStandardCatalog, createWarehouse, updateWarehouseAddress, deleteWarehouse } from "./actions";
import { Warehouse as WarehouseIcon, Trash2 } from "lucide-react";
import { getMaterialIcon } from "./standard-icons";

const STATUS_DOT: Record<string, string> = {
  ok: "🟢",
  scazut: "🟠",
  critic: "🔴",
};

type Kind = "toate" | "material" | "tool";

export default async function MaterialePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; imported?: string }>;
}) {
  const { q, kind: rawKind, imported } = await searchParams;
  const kind: Kind = rawKind === "material" || rawKind === "tool" ? rawKind : "toate";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: warehouses }, { data: materials }] = await Promise.all([
    supabase
      .from("warehouses")
      .select("id, name, address, lat, lng, is_central")
      .eq("organization_id", organization.id)
      .order("is_central", { ascending: false })
      .order("created_at"),
    (() => {
      let query = supabase
        .from("materials")
        .select("id, name, category, unit, min_stock, kind, image_path, material_stock(quantity, warehouse_id)")
        .eq("organization_id", organization.id);
      if (q) query = query.ilike("name", `%${q}%`);
      if (kind !== "toate") query = query.eq("kind", kind);
      return query.order("category").order("name");
    })(),
  ]);

  const warehouse = (warehouses ?? []).find((w) => w.is_central) ?? warehouses?.[0];
  const warehouseId = warehouse?.id;

  const rows = (materials ?? []).map((m) => {
    const quantity = m.material_stock.find((s) => s.warehouse_id === warehouseId)?.quantity ?? 0;
    const status: "ok" | "scazut" | "critic" =
      quantity >= m.min_stock ? "ok" : quantity >= m.min_stock * 0.5 ? "scazut" : "critic";
    const imageUrl = m.image_path
      ? supabase.storage.from("attachments").getPublicUrl(m.image_path).data.publicUrl
      : null;
    return { ...m, quantity, status, imageUrl };
  });

  const total = rows.length;
  const okCount = rows.filter((r) => r.status === "ok").length;
  const lowCount = rows.filter((r) => r.status === "scazut").length;
  const criticalCount = rows.filter((r) => r.status === "critic").length;

  const kindHref = (k: Kind) => {
    const params = new URLSearchParams();
    if (k !== "toate") params.set("kind", k);
    if (q) params.set("q", q);
    return params.toString() ? `/materiale?${params}` : "/materiale";
  };

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-extrabold text-foreground">Materiale &amp; Scule</h1>

        <div className="flex gap-0.5 rounded-[9px] bg-neutral-bg p-[3px]">
          {(["toate", "material", "tool"] as Kind[]).map((k) => (
            <Link
              key={k}
              href={kindHref(k)}
              className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-bold ${
                kind === k ? "bg-white text-foreground shadow-sm" : "text-muted"
              }`}
            >
              {k === "toate" ? "Toate" : k === "material" ? "Materiale" : "Scule"}
            </Link>
          ))}
        </div>

        <form className="flex max-w-[280px] flex-1 items-center gap-2 rounded-[10px] bg-neutral-bg px-3.5 py-2.5">
          <Search className="h-3.5 w-3.5 text-muted-2" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-2"
          />
          {kind !== "toate" && <input type="hidden" name="kind" value={kind} />}
        </form>

        <div className="flex-1" />

        <form action={importStandardCatalog}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-[13px] font-bold text-[#344054]"
          >
            <Download className="h-3.5 w-3.5" /> Importă catalog standard
          </button>
        </form>
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

      {imported !== undefined && (
        <div className="rounded-[10px] bg-success-bg px-4 py-2.5 text-[13px] font-semibold text-success">
          {Number(imported) > 0
            ? `S-au adăugat ${imported} materiale/scule noi din catalogul standard.`
            : "Catalogul standard e deja complet inclus — nimic nou de adăugat."}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Materiale în stoc" value={total} />
        <StatCard label="🟢 Stoc OK" value={okCount} color="text-success" />
        <StatCard label="🟠 Stoc scăzut" value={lowCount} color="text-warning" />
        <StatCard label="🔴 Stoc critic" value={criticalCount} color="text-danger" />
      </div>

      <div className="overflow-hidden rounded-[13px] border border-border bg-white">
        <div className="flex items-center gap-2 border-b border-[#f2f4f7] px-5 py-3.5">
          <WarehouseIcon className="h-4 w-4 text-electric" />
          <div className="text-[14.5px] font-bold">Depozite</div>
          <div className="flex-1" />
          <div className="text-[11.5px] text-muted-2">Apar pe hărțile administratorului și în navigarea tehnicianului</div>
        </div>
        <div className="flex flex-col divide-y divide-[#f2f4f7]">
          {(warehouses ?? []).map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-electric-soft">
                <WarehouseIcon className="h-4 w-4 text-electric" />
              </div>
              <div className="w-[160px] shrink-0 text-[13px] font-bold text-foreground">
                {w.name}
                {w.is_central && <span className="ml-1.5 text-[10px] font-bold text-muted-2">CENTRAL</span>}
              </div>
              <form action={updateWarehouseAddress} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="warehouseId" value={w.id} />
                <input
                  name="address"
                  defaultValue={w.address ?? ""}
                  placeholder="Adresă depozit — ex: Str. Exemplu 10, București"
                  className="w-full rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <button type="submit" className="shrink-0 rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]">
                  Salvează
                </button>
              </form>
              {w.lat != null && w.lng != null && (
                <span className="shrink-0 text-[11px] font-semibold text-success">📍 pe hartă</span>
              )}
              {!w.is_central && (
                <form action={deleteWarehouse}>
                  <input type="hidden" name="warehouseId" value={w.id} />
                  <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
        <form action={createWarehouse} className="flex items-center gap-2 border-t border-[#f2f4f7] px-5 py-3">
          <input
            name="name"
            required
            placeholder="Nume depozit nou — ex: Depozit Nord"
            className="w-[220px] rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
          />
          <input
            name="address"
            placeholder="Adresă (opțional acum, o poți adăuga după)"
            className="flex-1 rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
          />
          <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-electric px-3.5 py-2 text-[12.5px] font-bold text-white">
            <Plus className="h-3.5 w-3.5" /> Adaugă depozit
          </button>
        </form>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">
            {warehouse?.name ?? "Depozit central"}
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Material / sculă</th>
                <th className="px-5 py-3">Categorie</th>
                <th className="px-5 py-3">Stoc total</th>
                <th className="px-5 py-3">Stoc minim</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const Icon = getMaterialIcon(r.name, r.kind);
                return (
                <tr key={r.id} className="border-t border-[#f2f4f7]">
                  <td className="px-5 py-3 text-[13.5px] font-bold text-foreground">
                    <Link href={`/materiale/${r.id}`} className="flex items-center gap-2.5 hover:text-electric">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#eaecf0] bg-neutral-bg">
                        {r.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-3.5 w-3.5 text-muted-2" />
                        )}
                      </div>
                      {r.name}
                    </Link>
                  </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Niciun material găsit"
          description={q ? "Încearcă altă căutare." : "Adaugă primul material sau importă catalogul standard."}
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

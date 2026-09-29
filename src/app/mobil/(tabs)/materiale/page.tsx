import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Package, Truck, User, Wrench, Send, Warehouse } from "lucide-react";
import { consumeMaterial, reportShortage, requestPurchase } from "./actions";

export default async function MobileMaterialsPage() {
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name, vehicles(id, name, plate_number, driver_id))")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const vehicle = membership?.teams?.vehicles?.[0] ?? null;

  const [{ data: stock }, { data: driver }, { data: assignments }] = await Promise.all([
    vehicle
      ? supabase
          .from("material_stock")
          .select("id, quantity, materials(id, name, category, unit, min_stock)")
          .eq("vehicle_id", vehicle.id)
          .order("name", { foreignTable: "materials" })
      : Promise.resolve({ data: null }),
    vehicle?.driver_id
      ? supabase.from("profiles").select("full_name").eq("id", vehicle.driver_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("job_assignments")
      .select("jobs(id, display_number, title, status, scheduled_date)")
      .eq("profile_id", profile.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const jobs = (assignments ?? []).map((a) => a.jobs).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const currentJob =
    jobs.find((j) => j.status === "in_lucru" || j.status === "pauza") ??
    jobs.find((j) => j.scheduled_date === today && j.status !== "finalizata" && j.status !== "anulata");

  const { data: requiredItems } = currentJob
    ? await supabase
        .from("job_required_items")
        .select("id, kind, quantity_needed, custom_name, materials(id, name, unit)")
        .eq("job_id", currentJob.id)
    : { data: null };

  const { data: centralWarehouse } = currentJob
    ? await supabase
        .from("warehouses")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("is_central", true)
        .maybeSingle()
    : { data: null };

  const { data: depotStock } = centralWarehouse
    ? await supabase
        .from("material_stock")
        .select("material_id, quantity")
        .eq("warehouse_id", centralWarehouse.id)
    : { data: null };
  const depotByMaterialId = new Map((depotStock ?? []).map((s) => [s.material_id, s.quantity]));

  const { data: myRequests } = currentJob
    ? await supabase
        .from("purchase_requests")
        .select("id, status, material_id, custom_name")
        .eq("job_id", currentJob.id)
        .eq("requested_by", profile.id)
    : { data: null };

  const rows = (stock ?? []).filter((s) => s.materials);
  // min_stock is a warehouse reorder threshold, not a van par level — a van always
  // carries a small fraction of it. Items a van holds "one of" (min_stock <= 3, e.g.
  // hand tools) are only critical when actually out; bulk consumables (cable, doze,
  // etc.) are critical only when the van itself is nearly empty of them.
  const isCritical = (qty: number, minStock: number) => (minStock <= 3 ? qty === 0 : qty < minStock * 0.15);
  const criticalCount = rows.filter((s) => isCritical(s.quantity, s.materials?.min_stock ?? 0)).length;

  const stockByMaterialId = new Map(rows.map((s) => [s.materials!.id, s.quantity]));
  const requestedKeys = new Set(
    (myRequests ?? []).map((r) => (r.material_id ? `m:${r.material_id}` : `c:${r.custom_name}`))
  );

  if (!vehicle) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon={Package}
          title="Nicio dubă asociată"
          description="Nu ești încă alocat unei echipe cu vehicul, deci nu ai stoc de materiale asignat."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 border-b border-[#eaecf0] bg-white px-5 pb-3.5 pt-1.5">
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-extrabold">Stocul meu</div>
          <div className="rounded-full bg-electric-soft px-3 py-1.5 text-[11.5px] font-bold text-electric">
            {vehicle.name}
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          <Truck className="h-3.5 w-3.5" /> {vehicle.plate_number ?? "—"}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-neutral-bg px-3 py-2">
          <User className="h-4 w-4 shrink-0 text-electric" />
          {driver ? (
            <div className="text-[13px]">
              <span className="text-muted-2">Șofer: </span>
              <span className="font-bold text-foreground">{driver.full_name}</span>
            </div>
          ) : (
            <span className="text-[13px] font-semibold text-danger">Șofer nesetat</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {currentJob && (
          <div className="rounded-[13px] border border-electric bg-electric-soft/40 p-3.5">
            <div className="text-[11.5px] font-bold text-electric">
              PENTRU LUCRAREA #{currentJob.display_number} — {currentJob.title.toUpperCase()}
            </div>
            {requiredItems && requiredItems.length > 0 ? (
              <div className="mt-2.5 flex flex-col gap-2">
                {requiredItems.map((item) => {
                  const name = item.materials?.name ?? item.custom_name ?? "—";
                  const have = item.materials ? stockByMaterialId.get(item.materials.id) ?? 0 : null;
                  const covered = have !== null && have >= item.quantity_needed;
                  const depotHave = item.materials ? depotByMaterialId.get(item.materials.id) ?? 0 : null;
                  const availableAtDepot = !covered && depotHave !== null && depotHave >= item.quantity_needed;
                  const key = item.materials ? `m:${item.materials.id}` : `c:${item.custom_name}`;
                  const alreadyRequested = requestedKeys.has(key);
                  return (
                    <div key={item.id} className="flex items-center gap-2 rounded-[10px] bg-white p-2.5">
                      {item.kind === "tool" ? (
                        <Wrench className="h-4 w-4 shrink-0 text-muted-2" />
                      ) : (
                        <Package className="h-4 w-4 shrink-0 text-muted-2" />
                      )}
                      <div className="flex-1">
                        <div className="text-[13px] font-bold">{name}</div>
                        <div className="text-[11px] text-muted-2">
                          Necesar: {item.quantity_needed} {item.materials?.unit ?? "buc"}
                          {have !== null ? ` · Ai în dubă: ${have}` : ""}
                        </div>
                      </div>
                      {covered ? (
                        <span className="rounded-full bg-success-bg px-2 py-1 text-[10.5px] font-bold text-success">
                          OK
                        </span>
                      ) : availableAtDepot ? (
                        <span className="flex items-center gap-1 rounded-full bg-electric-soft px-2 py-1 text-[10.5px] font-bold text-electric">
                          <Warehouse className="h-3 w-3" /> La depozit
                        </span>
                      ) : alreadyRequested ? (
                        <span className="rounded-full bg-[#fef9ec] px-2 py-1 text-[10.5px] font-bold text-[#b45309]">
                          Cerută
                        </span>
                      ) : (
                        <form action={requestPurchase}>
                          <input type="hidden" name="jobId" value={currentJob.id} />
                          {item.materials ? (
                            <input type="hidden" name="materialId" value={item.materials.id} />
                          ) : (
                            <input type="hidden" name="customName" value={item.custom_name ?? ""} />
                          )}
                          <input type="hidden" name="quantity" value={item.quantity_needed} />
                          <button
                            type="submit"
                            className="flex items-center gap-1 rounded-[8px] bg-danger-bg px-2.5 py-1.5 text-[11px] font-bold text-danger"
                          >
                            <Send className="h-3 w-3" /> Cere aprobare
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1.5 text-[12px] text-[#475467]">
                Nimic definit special pentru această lucrare — folosește stocul general de mai jos.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2.5">
          <div className="flex-1 rounded-[12px] border border-[#eaecf0] bg-white p-3 text-center">
            <div className="text-[18px] font-extrabold">{rows.length}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-muted-2">MATERIALE</div>
          </div>
          <div className="flex-1 rounded-[12px] border border-danger-bg bg-danger-bg p-3 text-center">
            <div className="text-[18px] font-extrabold text-danger">{criticalCount}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-danger">STOC CRITIC</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Package} title="Nicio dubă stocată" description="Duba ta nu are încă materiale alocate." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((s) => {
              const m = s.materials!;
              const critical = isCritical(s.quantity, m.min_stock);
              return (
                <div
                  key={s.id}
                  className={`rounded-[13px] bg-white p-3.5 ${
                    critical ? "border-[1.5px] border-danger-bg" : "border border-[#eaecf0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold">{m.name}</div>
                      <div className="text-[11.5px] text-muted-2">{m.category ?? "—"}</div>
                    </div>
                    <div className={`text-[15px] font-extrabold ${critical ? "text-danger" : ""}`}>
                      {s.quantity} {m.unit}
                      {critical ? " 🔴" : ""}
                    </div>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <form action={consumeMaterial} className="flex flex-1 items-center gap-1.5">
                      <input type="hidden" name="stockId" value={s.id} />
                      <input type="hidden" name="materialId" value={m.id} />
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <input
                        type="number"
                        name="qty"
                        defaultValue={1}
                        min={1}
                        className="w-12 rounded-[8px] border border-[#d0d5dd] px-1.5 py-2 text-center text-[12px]"
                      />
                      <button
                        type="submit"
                        className="flex-1 rounded-[8px] bg-neutral-bg py-2 text-[12px] font-bold text-[#344054]"
                      >
                        Consumă
                      </button>
                    </form>
                    <form action={reportShortage} className="flex-1">
                      <input type="hidden" name="stockId" value={s.id} />
                      <input type="hidden" name="materialId" value={m.id} />
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <button
                        type="submit"
                        className="w-full rounded-[8px] bg-danger-bg py-2 text-[12px] font-bold text-danger"
                      >
                        Raportează lipsă
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

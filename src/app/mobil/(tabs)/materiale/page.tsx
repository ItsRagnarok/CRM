import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { Package } from "lucide-react";
import { consumeMaterial, reportShortage } from "./actions";

export default async function MobileMaterialsPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name, vehicles(id, name, plate_number))")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const vehicle = membership?.teams?.vehicles?.[0] ?? null;

  const { data: stock } = vehicle
    ? await supabase
        .from("material_stock")
        .select("id, quantity, materials(id, name, category, unit, min_stock)")
        .eq("vehicle_id", vehicle.id)
        .order("name", { foreignTable: "materials" })
    : { data: null };

  const rows = (stock ?? []).filter((s) => s.materials);
  const criticalCount = rows.filter((s) => s.quantity < (s.materials?.min_stock ?? 0) * 0.5).length;

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
        <div className="mt-1 text-[12.5px] text-muted">Materiale disponibile în vehicul</div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
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
              const isCritical = s.quantity < m.min_stock * 0.5;
              return (
                <div
                  key={s.id}
                  className={`rounded-[13px] bg-white p-3.5 ${
                    isCritical ? "border-[1.5px] border-danger-bg" : "border border-[#eaecf0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold">{m.name}</div>
                      <div className="text-[11.5px] text-muted-2">{m.category ?? "—"}</div>
                    </div>
                    <div className={`text-[15px] font-extrabold ${isCritical ? "text-danger" : ""}`}>
                      {s.quantity} {m.unit}
                      {isCritical ? " 🔴" : ""}
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

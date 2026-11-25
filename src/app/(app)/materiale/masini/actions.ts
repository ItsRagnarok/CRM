"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restockNeed } from "@/lib/vehicle-stock";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const num = (fd: FormData, k: string) => {
  const raw = String(fd.get(k) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : NaN;
};
const back = (vehicleId: string, extra = "") => `/materiale/masini?v=${vehicleId}${extra}`;

/** Pune sau schimbă un material în lista mașinii (țintă + prag). */
export async function setVehicleTarget(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const vehicleId = String(fd.get("vehicleId") ?? "");
  const materialId = String(fd.get("materialId") ?? "");
  if (!ctx || !UUID.test(vehicleId) || !UUID.test(materialId)) return;
  const target = num(fd, "target");
  const min = num(fd, "min");
  if (target === null || Number.isNaN(target) || Number.isNaN(min as number)) redirect(back(vehicleId, "&eroare=numar"));
  const supabase = await createClient();
  const { data: existing } = await supabase.from("material_stock").select("id").eq("vehicle_id", vehicleId).eq("material_id", materialId).maybeSingle();
  if (existing) {
    await supabase.from("material_stock").update({ target_qty: target, min_qty: min }).eq("id", existing.id);
  } else {
    await supabase.from("material_stock").insert({ organization_id: ctx.organization.id, vehicle_id: vehicleId, material_id: materialId, quantity: 0, target_qty: target, min_qty: min });
  }
  revalidatePath("/materiale/masini");
  redirect(back(vehicleId));
}

/** Scoate materialul din lista mașinii; dacă nu mai e nimic în mașină, dispare cu totul. */
export async function removeFromVehicleList(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const stockId = String(fd.get("stockId") ?? "");
  const vehicleId = String(fd.get("vehicleId") ?? "");
  if (!ctx || !UUID.test(stockId) || !UUID.test(vehicleId)) return;
  const supabase = await createClient();
  const { data: row } = await supabase.from("material_stock").select("quantity").eq("id", stockId).eq("organization_id", ctx.organization.id).maybeSingle();
  if (!row) return;
  if (Number(row.quantity) <= 0) await supabase.from("material_stock").delete().eq("id", stockId);
  else await supabase.from("material_stock").update({ target_qty: null, min_qty: null }).eq("id", stockId);
  revalidatePath("/materiale/masini");
  redirect(back(vehicleId));
}

/** Încarcă din depozit tot ce e sub prag, până la țintă. */
export async function loadVehicle(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const vehicleId = String(fd.get("vehicleId") ?? "");
  if (!ctx || !UUID.test(vehicleId)) return;
  const supabase = await createClient();
  const { data: rows } = await supabase.from("material_stock").select("material_id, quantity, target_qty, min_qty").eq("vehicle_id", vehicleId);
  const items = (rows ?? []).map((r) => ({ material_id: r.material_id, qty: restockNeed(r) })).filter((x) => x.qty > 0);
  if (!items.length) redirect(back(vehicleId, "&incarcat=0"));
  const { data, error } = await supabase.rpc("load_vehicle_from_warehouse", { p_vehicle: vehicleId, p_items: items });
  if (error) redirect(back(vehicleId, "&eroare=incarcare"));
  const res = (data ?? {}) as { moved?: unknown[]; short?: unknown[] };
  revalidatePath("/materiale/masini");
  revalidatePath("/materiale");
  revalidatePath("/mobil/materiale");
  redirect(back(vehicleId, `&incarcat=${res.moved?.length ?? 0}&lipsa=${res.short?.length ?? 0}`));
}

/** Copiază lista (țintă + prag) de la o mașină la alta; cantitățile existente rămân. */
export async function copyVehicleList(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const from = String(fd.get("vehicleId") ?? "");
  const to = String(fd.get("toVehicleId") ?? "");
  if (!ctx || !UUID.test(from) || !UUID.test(to) || from === to) return;
  const supabase = await createClient();
  const [{ data: src }, { data: dst }] = await Promise.all([
    supabase.from("material_stock").select("material_id, target_qty, min_qty").eq("vehicle_id", from).not("target_qty", "is", null),
    supabase.from("material_stock").select("id, material_id").eq("vehicle_id", to),
  ]);
  const existing = new Map((dst ?? []).map((r) => [r.material_id, r.id]));
  for (const r of src ?? []) {
    const id = existing.get(r.material_id);
    if (id) await supabase.from("material_stock").update({ target_qty: r.target_qty, min_qty: r.min_qty }).eq("id", id);
    else await supabase.from("material_stock").insert({ organization_id: ctx.organization.id, vehicle_id: to, material_id: r.material_id, quantity: 0, target_qty: r.target_qty, min_qty: r.min_qty });
  }
  revalidatePath("/materiale/masini");
  redirect(back(to, "&copiat=1"));
}

/** Închide o cerere de reaprovizionare fără încărcare (ex. s-a rezolvat altfel). */
export async function closeRestockRequest(fd: FormData) {
  const ctx = await requireBackOfficeContext();
  const id = String(fd.get("requestId") ?? "");
  const vehicleId = String(fd.get("vehicleId") ?? "");
  if (!ctx || !UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("vehicle_restock_requests").update({ status: "rezolvata", resolved_by: ctx.userId, resolved_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.organization.id);
  revalidatePath("/materiale/masini");
  redirect(back(vehicleId));
}

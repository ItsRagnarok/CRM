"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function createMaterial(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Numele materialului este obligatoriu." };
  }
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "buc").trim() || "buc";
  const minStock = Math.max(0, Number(formData.get("minStock") ?? 0) || 0);
  const initialQty = Math.max(0, Number(formData.get("initialQty") ?? 0) || 0);

  const { data: material, error } = await supabase
    .from("materials")
    .insert({
      organization_id: organization.id,
      name,
      category,
      unit,
      min_stock: minStock,
    })
    .select("id")
    .single();

  if (error || !material) {
    return { error: "Nu am putut adăuga materialul. Încearcă din nou." };
  }

  if (initialQty > 0) {
    const { data: warehouse } = await supabase
      .from("warehouses")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("is_central", true)
      .maybeSingle();

    if (warehouse) {
      await supabase.from("material_stock").insert({
        organization_id: organization.id,
        material_id: material.id,
        warehouse_id: warehouse.id,
        quantity: initialQty,
      });
    }
  }

  revalidatePath("/materiale");
  redirect("/materiale");
}

// locationKey is "warehouse:<id>" or "vehicle:<id>" — bound in from the page
// so each row's inline form posts straight to the right stock location.
export async function setStockQuantity(
  materialId: string,
  locationKey: string,
  formData: FormData
) {
  if (!materialId) return;
  const [locationType, locationId] = locationKey.split(":");
  if (!locationId || (locationType !== "warehouse" && locationType !== "vehicle")) return;

  const quantity = Math.max(0, Math.round(Number(formData.get("quantity") ?? 0) || 0));
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const column = locationType === "warehouse" ? "warehouse_id" : "vehicle_id";

  const { data: existing } = await supabase
    .from("material_stock")
    .select("id")
    .eq("material_id", materialId)
    .eq(column, locationId)
    .maybeSingle();

  if (existing) {
    await supabase.from("material_stock").update({ quantity }).eq("id", existing.id);
  } else {
    await supabase.from("material_stock").insert({
      organization_id: organization.id,
      material_id: materialId,
      warehouse_id: locationType === "warehouse" ? locationId : null,
      vehicle_id: locationType === "vehicle" ? locationId : null,
      quantity,
    });
  }

  revalidatePath("/materiale");
}

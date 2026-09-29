"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { STANDARD_CATALOG } from "./standard-catalog";
import { geocodeAddress } from "@/lib/geocode";

type MaterialKind = "material" | "tool";

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
  const kind = String(formData.get("kind") ?? "material") as MaterialKind;

  const { data: material, error } = await supabase
    .from("materials")
    .insert({
      organization_id: organization.id,
      name,
      category,
      unit,
      min_stock: minStock,
      kind,
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

export async function importStandardCatalog() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("materials")
    .select("name")
    .eq("organization_id", organization.id);
  const existingNames = new Set((existing ?? []).map((m) => m.name.trim().toLowerCase()));

  const toInsert = STANDARD_CATALOG.filter((item) => !existingNames.has(item.name.toLowerCase())).map(
    (item) => ({
      organization_id: organization.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      min_stock: item.minStock,
      kind: item.kind,
    })
  );

  if (toInsert.length > 0) {
    await supabase.from("materials").insert(toInsert);
  }

  revalidatePath("/materiale");
  redirect(`/materiale?imported=${toInsert.length}`);
}

export async function updateMaterial(materialId: string, formData: FormData) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase
    .from("materials")
    .update({
      name,
      category: String(formData.get("category") ?? "").trim() || null,
      unit: String(formData.get("unit") ?? "buc").trim() || "buc",
      min_stock: Math.max(0, Number(formData.get("minStock") ?? 0) || 0),
      kind: String(formData.get("kind") ?? "material") as MaterialKind,
    })
    .eq("id", materialId)
    .eq("organization_id", organization.id);

  revalidatePath(`/materiale/${materialId}`);
  revalidatePath("/materiale");
}

export async function uploadMaterialImage(materialId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${organization.id}/materials/${materialId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return;

  const { data: existing } = await supabase
    .from("materials")
    .select("image_path")
    .eq("id", materialId)
    .maybeSingle();

  await supabase
    .from("materials")
    .update({ image_path: path })
    .eq("id", materialId)
    .eq("organization_id", organization.id);

  if (existing?.image_path) {
    await supabase.storage.from("attachments").remove([existing.image_path]);
  }

  revalidatePath(`/materiale/${materialId}`);
  revalidatePath("/materiale");
}

export async function createWarehouse(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const address = String(formData.get("address") ?? "").trim() || null;

  const coords = address ? await geocodeAddress(address) : null;

  await supabase.from("warehouses").insert({
    organization_id: organization.id,
    name,
    address,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  });

  revalidatePath("/materiale");
  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

export async function updateWarehouseAddress(formData: FormData) {
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!warehouseId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const address = String(formData.get("address") ?? "").trim() || null;
  const coords = address ? await geocodeAddress(address) : null;

  await supabase
    .from("warehouses")
    .update({ address, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    .eq("id", warehouseId)
    .eq("organization_id", organization.id);

  revalidatePath("/materiale");
  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

export async function deleteWarehouse(formData: FormData) {
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!warehouseId) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("warehouses")
    .delete()
    .eq("id", warehouseId)
    .eq("organization_id", organization.id)
    .eq("is_central", false);

  revalidatePath("/materiale");
  revalidatePath("/harta");
  revalidatePath("/dashboard");
}

export async function deleteMaterialImage(materialId: string) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("materials")
    .select("image_path")
    .eq("id", materialId)
    .maybeSingle();
  if (!existing?.image_path) return;

  await supabase.storage.from("attachments").remove([existing.image_path]);
  await supabase
    .from("materials")
    .update({ image_path: null })
    .eq("id", materialId)
    .eq("organization_id", organization.id);

  revalidatePath(`/materiale/${materialId}`);
  revalidatePath("/materiale");
}

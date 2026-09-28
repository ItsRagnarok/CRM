"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function consumeMaterial(formData: FormData) {
  const stockId = String(formData.get("stockId") ?? "");
  const materialId = String(formData.get("materialId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const qty = Math.max(1, Number(formData.get("qty") ?? 1) || 1);
  if (!stockId || !materialId || !vehicleId) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const { data: stock } = await supabase
    .from("material_stock")
    .select("quantity")
    .eq("id", stockId)
    .maybeSingle();
  if (!stock) return;

  const newQty = Math.max(0, stock.quantity - qty);
  await supabase.from("material_stock").update({ quantity: newQty }).eq("id", stockId);

  // If the technician has an active job right now, log the consumption
  // against it — otherwise there's nothing real to attribute it to.
  const { data: assignments } = await supabase
    .from("job_assignments")
    .select("jobs(id, status)")
    .eq("profile_id", userId);
  const activeJob = (assignments ?? [])
    .map((a) => a.jobs)
    .find((j) => j && (j.status === "in_lucru" || j.status === "pauza"));

  if (activeJob) {
    await supabase.from("material_usage").insert({
      organization_id: organization.id,
      material_id: materialId,
      job_id: activeJob.id,
      quantity: qty,
      source_vehicle_id: vehicleId,
      used_by: userId,
      is_shortage: false,
    });
  }

  revalidatePath("/mobil/materiale");
}

export async function reportShortage(formData: FormData) {
  const stockId = String(formData.get("stockId") ?? "");
  if (!stockId) return;
  const supabase = await createClient();

  await supabase.from("material_stock").update({ quantity: 0 }).eq("id", stockId);

  revalidatePath("/mobil/materiale");
}

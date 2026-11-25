"use server";

import { revalidatePath } from "next/cache";
import { notifyBackOffice } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { restockNeed } from "@/lib/vehicle-stock";

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
  const materialId = String(formData.get("materialId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!stockId) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("material_stock").update({ quantity: 0 }).eq("id", stockId);

  // Log it against the active job so the office sees a real shortage record
  // instead of the stock silently going to zero with no explanation.
  if (materialId && vehicleId) {
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
        quantity: 0,
        source_vehicle_id: vehicleId,
        used_by: userId,
        is_shortage: true,
      });
    }
  }

  revalidatePath("/mobil/materiale");
}

export async function requestPurchase(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const materialId = String(formData.get("materialId") ?? "").trim() || null;
  const customName = String(formData.get("customName") ?? "").trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  if (!jobId || (!materialId && !customName)) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("purchase_requests").insert({
    organization_id: organization.id,
    job_id: jobId,
    requested_by: userId,
    material_id: materialId,
    custom_name: materialId ? null : customName,
    quantity,
  });

  const [{ data: requester }, { data: material }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    materialId
      ? supabase.from("materials").select("name").eq("id", materialId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "purchase_request",
    title: "Cerere de achiziție nouă",
    body: `${requester?.full_name ?? "Tehnicianul"} cere ${quantity} × ${material?.name ?? customName}`,
    jobId,
    link: "/aprobari",
  });

  revalidatePath("/mobil/materiale");
}

/**
 * „Cere reaprovizionare”: tehnicianul trimite lista a ce e sub prag în mașina lui.
 * Biroul o vede la Stoc pe mașini și o rezolvă încărcând din depozit.
 */
export async function requestRestock(_prev: { ok?: boolean; error?: string } | undefined, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!vehicleId) return { error: "Nu ai mașină asociată." };
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const { data: open } = await supabase.from("vehicle_restock_requests").select("id").eq("vehicle_id", vehicleId).eq("status", "noua").limit(1);
  if (open?.length) return { ok: true };

  const { data: rows } = await supabase
    .from("material_stock")
    .select("material_id, quantity, target_qty, min_qty, materials(name, unit)")
    .eq("vehicle_id", vehicleId);
  const items = (rows ?? [])
    .map((r) => ({ material_id: r.material_id, name: r.materials?.name ?? "—", unit: r.materials?.unit ?? null, qty: restockNeed(r) }))
    .filter((i) => i.qty > 0);
  if (!items.length && !note) return { error: "Totul e peste prag. Scrie ce îți lipsește." };

  const { error } = await supabase.from("vehicle_restock_requests").insert({ organization_id: organization.id, vehicle_id: vehicleId, requested_by: userId, note, items });
  if (error) return { error: "Nu am putut trimite. Încearcă din nou." };

  const [{ data: requester }, { data: vehicle }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("vehicles").select("name").eq("id", vehicleId).maybeSingle(),
  ]);
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "restock_request",
    title: `Reaprovizionare: ${vehicle?.name ?? "mașină"}`,
    body: `${requester?.full_name ?? "Tehnicianul"} cere ${items.length ? `${items.length} articole` : "reaprovizionare"}${note ? ` · ${note}` : ""}`,
    link: `/materiale/masini?v=${vehicleId}`,
    exceptProfileId: userId,
  });
  // Fără revalidare: formularul arată confirmarea din răspuns; lista se reîmprospătează la următoarea deschidere.
  return { ok: true };
}

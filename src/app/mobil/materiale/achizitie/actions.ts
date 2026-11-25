"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBackOffice } from "@/lib/notify";
import { confirmAi } from "@/app/mobil/ai/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Achiziție urgentă: tehnicianul a cumpărat de la magazin pentru o lucrare.
 * Un singur pas: bonul + ce a luat + lucrarea + mașina devin o cheltuială „Materiale” pe lucrare,
 * pe care biroul o aprobă. Costul intră în marja lucrării o singură dată, prin cheltuială.
 */
export async function submitUrgentPurchase(_prev: { error?: string } | undefined, fd: FormData) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const jobId = String(fd.get("jobId") ?? "");
  const amount = Number(String(fd.get("amount") ?? "").replace(",", "."));
  const vendor = String(fd.get("vendor") ?? "").trim().slice(0, 120) || null;
  const paidWith = String(fd.get("paidWith") ?? "own") === "company" ? "company" : "own";
  const receipt = fd.get("receipt") as File | null;

  const names = fd.getAll("itemName").map((x) => String(x).trim().slice(0, 120));
  const qtys = fd.getAll("itemQty").map((x) => Number(String(x).replace(",", ".")));
  const ids = fd.getAll("itemMaterialId").map((x) => String(x));
  const units = fd.getAll("itemUnit").map((x) => String(x).slice(0, 20));
  const items = names
    .map((name, i) => ({ name, qty: qtys[i], material_id: UUID.test(ids[i] ?? "") ? ids[i] : null, unit: units[i] || null }))
    .filter((x) => x.name && Number.isFinite(x.qty) && x.qty > 0)
    .slice(0, 30);

  if (!UUID.test(jobId)) return { error: "Alege lucrarea pentru care ai cumpărat." };
  if (!items.length) return { error: "Scrie ce ai cumpărat (cel puțin un articol, cu cantitate)." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) return { error: "Scrie suma de pe bon." };
  if (!receipt || receipt.size === 0) return { error: "Fă o poză bonului: biroul are nevoie de ea la decont." };
  if (receipt.size > 15 * 1024 * 1024) return { error: "Poza e prea mare. Încearcă din nou." };

  const { data: job } = await supabase.from("jobs").select("id").eq("id", jobId).eq("organization_id", organization.id).maybeSingle();
  if (!job) return { error: "Lucrarea nu mai există." };

  const { data: membership } = await supabase.from("team_members").select("teams(vehicles(id))").eq("profile_id", userId).maybeSingle();
  const vehicleId = membership?.teams?.vehicles?.[0]?.id ?? null;

  const safeName = receipt.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80) || "bon.jpg";
  const path = `${organization.id}/jobs/${jobId}/receipts/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage.from("attachments").upload(path, receipt, { contentType: receipt.type || "image/jpeg" });
  if (upErr) return { error: "Nu am putut urca poza bonului. Verifică semnalul și încearcă din nou." };

  const { error } = await supabase.from("expenses").insert({
    organization_id: organization.id,
    job_id: jobId,
    category: "materiale",
    vendor,
    amount: Math.round(amount * 100) / 100,
    submitted_by: userId,
    receipt_path: path,
    paid_with: paidWith,
    vehicle_id: vehicleId,
    items,
    notes: "Achiziție urgentă de la magazin",
  });
  if (error) return { error: "Nu am putut trimite. Încearcă din nou." };

  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "expense_submitted",
    title: "Achiziție urgentă de la magazin",
    body: `${me?.full_name ?? "Tehnicianul"}: ${amount.toFixed(2)} lei${vendor ? ` la ${vendor}` : ""} · ${items.map((i) => i.name).join(", ").slice(0, 120)}`,
    jobId,
    link: "/cheltuieli",
    exceptProfileId: userId,
  });

  // Bon citit cu AI: notăm în jurnal ce a rămas după verificarea omului.
  const logId = String(fd.get("aiLogId") ?? "");
  if (logId) {
    let suggested: Record<string, unknown> = {};
    try { suggested = JSON.parse(String(fd.get("aiSuggested") ?? "{}")); } catch { /* fără propuneri */ }
    await confirmAi(logId, suggested, { amount: String(fd.get("amount") ?? ""), vendor: vendor ?? "", items: items.map((i) => i.name).join("|") });
  }

  revalidatePath("/cheltuieli");
  revalidatePath("/materiale/masini");
  revalidatePath(`/lucrari/${jobId}`);
  redirect("/mobil/materiale?achizitie=1");
}

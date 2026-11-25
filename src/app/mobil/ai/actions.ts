"use server";

import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { readImageJson } from "@/lib/ai-vision";
import { PLATE_PROMPT, RECEIPT_PROMPT, countCorrections, normalizePlate, normalizeReceipt, type Plate, type Receipt } from "@/lib/ai-extract";
import { todayInOrgTimeZone } from "@/lib/date";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Feature = "bon" | "placuta" | "eticheta";

async function run(fd: FormData, feature: Feature, prompt: string) {
  const { organization, userId, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu trimite poze la AI." } as const;
  if (organization.ai_enabled === false) return { error: "AI-ul e oprit pentru firmă (Setări → AI)." } as const;
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Nu am primit nicio poză." } as const;
  if (file.size > 4 * 1024 * 1024) return { error: "Poza e prea mare. Fă-o din nou." } as const;
  const supabase = await createClient();
  // Limită simplă: 60 de citiri pe oră de fiecare om.
  const { count } = await supabase.from("ai_log").select("id", { count: "exact", head: true }).eq("profile_id", userId).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= 60) return { error: "Prea multe citiri într-o oră. Completează de mână." } as const;
  const r = await readImageJson(file, prompt);
  return { r, supabase, organization, userId } as const;
}

async function log(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string, feature: Feature, r: Awaited<ReturnType<typeof readImageJson>>, suggested: unknown) {
  const { data } = await supabase
    .from("ai_log")
    .insert({ organization_id: orgId, profile_id: userId, feature, provider: r.provider, model: r.model, ok: r.ok, error: r.ok ? null : r.error, ms: r.ms, suggested: (suggested ?? null) as never })
    .select("id")
    .single();
  return data?.id ?? null;
}

/** Poza bonului → furnizor, dată, total, TVA, articole. Omul verifică și corectează înainte de trimitere. */
export async function readReceipt(fd: FormData): Promise<{ error: string } | { logId: string | null; receipt: Receipt }> {
  const x = await run(fd, "bon", RECEIPT_PROMPT);
  if ("error" in x) return { error: x.error! };
  const { r, supabase, organization, userId } = x;
  if (!r.ok) {
    await log(supabase, organization.id, userId, "bon", r, null);
    return { error: "Nu am putut citi bonul acum. Completează de mână." };
  }
  const receipt = normalizeReceipt(r.data, todayInOrgTimeZone());
  const logId = await log(supabase, organization.id, userId, "bon", r, receipt);
  if (!receipt.total && !receipt.furnizor) return { error: "Nu se vede bine bonul. Fă poza mai aproape, cu lumină, sau completează de mână." };
  return { logId, receipt };
}

/** Poza plăcuței / etichetei → marcă, model, serie, putere. */
export async function readPlate(fd: FormData): Promise<{ error: string } | { logId: string | null; plate: Plate }> {
  const feature: Feature = fd.get("feature") === "eticheta" ? "eticheta" : "placuta";
  const x = await run(fd, feature, PLATE_PROMPT);
  if ("error" in x) return { error: x.error! };
  const { r, supabase, organization, userId } = x;
  if (!r.ok) {
    await log(supabase, organization.id, userId, feature, r, null);
    return { error: "Nu am putut citi plăcuța acum. Completează de mână." };
  }
  const plate = normalizePlate(r.data);
  const logId = await log(supabase, organization.id, userId, feature, r, plate);
  if (!plate.serie && !plate.model && !plate.marca) return { error: "Nu se vede bine plăcuța. Fă poza mai aproape, fără reflexii, sau completează de mână." };
  return { logId, plate };
}

/** Ce a rămas după verificarea omului: intră în jurnal cu numărul de câmpuri corectate. */
export async function confirmAi(logId: string, suggested: Record<string, unknown>, final: Record<string, unknown>) {
  if (!UUID.test(logId)) return;
  await requireSessionContext();
  const supabase = await createClient();
  const { fields, corrected } = countCorrections(suggested, final);
  await supabase.rpc("ai_log_confirm", { p_id: logId, p_final: final as never, p_fields: fields, p_corrected: corrected });
}

"use server";

import { revalidatePath } from "next/cache";
import { requireBackOfficeContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { METRIC_IDS, type MetricId } from "@/lib/monday";

/** Patronul (administratorul) alege cele 3 cifre și pragurile lor. */
export async function saveMondayConfig(_prev: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx || ctx.profile.role !== "admin") return { error: "Doar administratorul firmei alege cifrele." };
  const metrics = fd.getAll("metric").map(String).filter((m): m is MetricId => METRIC_IDS.includes(m as MetricId));
  const unique = [...new Set(metrics)];
  if (unique.length === 0) return { error: "Alege cel puțin o cifră." };
  if (unique.length > 3) return { error: "Alege cel mult 3 cifre: altfel nu le mai urmărești." };
  const thresholds: Partial<Record<MetricId, number>> = {};
  for (const id of METRIC_IDS) {
    const raw = String(fd.get(`t_${id}`) ?? "").replace(/\s/g, "").replace(",", ".");
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { error: "Pragurile trebuie să fie numere pozitive." };
    thresholds[id] = id === "marja" ? Math.min(100, Math.round(n)) : Math.round(n);
  }
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ monday_config: { metrics: unique, thresholds } }).eq("id", ctx.organization.id);
  if (error) return { error: "Nu am putut salva. Încearcă din nou." };
  revalidatePath("/luni");
  return { ok: true };
}

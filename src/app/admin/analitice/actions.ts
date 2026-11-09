"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ipHash } from "@/lib/ip-key";

export type ExclusionState = { error?: string; ok?: string };

export async function addExclusion(_prev: ExclusionState | undefined, form: FormData): Promise<ExclusionState> {
  await requireAdminContext();
  const typed = String(form.get("ip") ?? "").trim();
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const current = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim();
  const source = typed || current;
  const hash = source ? ipHash(source) : null;
  if (!hash) return { error: typed ? "Adresa IP nu pare validă. Scrie-o exact ca pe whatismyip.com." : "Nu am putut citi adresa ta IP. Scrie-o manual." };
  const db = await createClient({ ignorePreview: true });
  const { error } = await db.rpc("ef_site_exclusion_add", { p_hash: hash, p_label: label || (typed ? "Adăugat manual" : "Adresa mea curentă") });
  if (error) return { error: "Nu am putut salva excluderea. Încearcă din nou." };
  revalidatePath("/admin/analitice");
  return { ok: "Adresa e exclusă. Vizitele de pe ea nu se mai numără de acum încolo." };
}

export async function removeExclusion(form: FormData): Promise<void> {
  await requireAdminContext();
  const hash = String(form.get("hash") ?? "");
  if (!/^[0-9a-f]{64}$/.test(hash)) return;
  const db = await createClient({ ignorePreview: true });
  await db.rpc("ef_site_exclusion_remove", { p_hash: hash });
  revalidatePath("/admin/analitice");
}

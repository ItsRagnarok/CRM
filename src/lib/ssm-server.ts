import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { loadScheduleWarnings } from "@/lib/schedule-warnings-server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Lucrare la înălțime: dacă cineva din echipă nu are „apt pentru lucru la înălțime” valabil,
 * salvarea cere confirmarea explicită a biroului, cu motiv. Confirmarea rămâne pe lucrare.
 */
export async function heightGate(
  supabase: Supabase,
  org: { id: string; standard_hours_per_day: number | null },
  userId: string,
  req: { jobId?: string | null; teamId: string | null; date: string; start: string | null; end: string | null; domain: string | null; atHeight: boolean },
  fd: FormData,
): Promise<{ error: string } | { override: Json | null }> {
  if (!req.atHeight) return { override: null };
  const warnings = (await loadScheduleWarnings(supabase, org, { ...req, materialIds: [] })).filter((w) => w.kind === "inaltime");
  if (!warnings.length) return { override: null };
  const note = String(fd.get("ssmOverrideNote") ?? "").trim().slice(0, 300);
  if (fd.get("ssmOverride") !== "on" || note.length < 5) {
    return { error: `Lucrare la înălțime: ${warnings.map((w) => w.text).join(" ")} Rezolvă în Conformitate sau bifează confirmarea și scrie motivul.` };
  }
  return { override: { by: userId, at: new Date().toISOString(), note, warnings: warnings.map((w) => w.text) } };
}

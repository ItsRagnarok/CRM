"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { demoFeature, isDemo } from "@/lib/demo";

/** Din ecranul blocat al unui cont demo: cererea ajunge în Super Admin → Solicitări. */
export async function requestDemoOffer(_prev: { sent?: boolean; error?: string } | undefined, fd: FormData): Promise<{ sent?: boolean; error?: string }> {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (readOnly) return { error: "Modul de vizualizare nu trimite cereri." };
  if (!isDemo(organization)) return { error: "Contul nu e în demo." };
  if (profile.role !== "admin") return { error: "Cererea o trimite administratorul contului." };
  const feature = demoFeature(String(fd.get("feature") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.from("subscription_requests").insert({
    organization_id: organization.id,
    kind: "feature",
    details: `Cont demo: ${profile.full_name} vrea ofertă și configurarea pentru „${feature?.label ?? "platformă"}”.`,
  });
  if (error) return { error: "Cererea nu a putut fi trimisă. Încearcă din nou." };
  revalidatePath("/admin/solicitari");
  return { sent: true };
}

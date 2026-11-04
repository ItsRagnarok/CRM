"use server";

import { revalidatePath } from "next/cache";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type RequestState = { error?: string; sent?: boolean };

export async function submitSubscriptionRequest(_state: RequestState, form: FormData): Promise<RequestState> {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (readOnly || profile.role !== "admin") return { error: "Cererea poate fi trimisă doar de administratorul companiei." };

  const kind = form.get("kind");
  if (kind !== "feature" && kind !== "cancellation") return { error: "Alege tipul cererii." };
  const details = String(form.get("details") ?? "").trim();
  if (details.length > 3000 || (kind === "feature" && !details)) {
    return { error: "Descrie cererea în maximum 3.000 de caractere." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscription_requests").insert({
    organization_id: organization.id,
    kind,
    details: details || "Solicit anularea abonamentului.",
  });
  if (error?.code === "23505" && kind === "cancellation") return { error: "Există deja o cerere de anulare în așteptare." };
  if (error) return { error: "Cererea nu a putut fi trimisă. Încearcă din nou." };
  revalidatePath("/setari");
  revalidatePath("/admin/solicitari");
  return { sent: true };
}

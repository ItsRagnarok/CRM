"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCompany(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const cui = String(formData.get("cui") ?? "").trim();
  const ownerFullName = String(formData.get("ownerFullName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim();
  const ownerPassword = String(formData.get("ownerPassword") ?? "");

  if (!companyName || !ownerFullName || !ownerEmail || !ownerPassword) {
    return { error: "Completează toate câmpurile obligatorii." };
  }
  if (ownerPassword.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  const supabase = await createClient();
  const { data: newOrgId, error } = await supabase.rpc("platform_admin_create_company", {
    company_name: companyName,
    company_cui: cui,
    owner_full_name: ownerFullName,
    owner_email: ownerEmail,
    owner_password: ownerPassword,
  });

  if (error) {
    return { error: error.message.includes("Există deja") ? error.message : "Nu am putut crea compania. Încearcă din nou." };
  }

  revalidatePath("/admin/companii");
  redirect(`/admin/companii/${newOrgId}`);
}

export async function deleteCompany(orgId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_admin_delete_company", { org_id: orgId });
  if (error) {
    return { error: "Nu am putut șterge compania. Încearcă din nou." };
  }

  revalidatePath("/admin/companii");
  redirect("/admin/companii");
}

export async function updateCompany(orgId: string, formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return;

  const supabase = await createClient();
  await supabase.rpc("platform_admin_update_company", {
    org_id: orgId,
    company_name: companyName,
    company_cui: String(formData.get("cui") ?? "").trim(),
    company_email: String(formData.get("email") ?? "").trim(),
    company_phone: String(formData.get("phone") ?? "").trim(),
    company_address: String(formData.get("address") ?? "").trim(),
    new_plan: String(formData.get("plan") ?? "starter") as SubscriptionPlan,
    new_is_active: formData.get("isActive") === "on",
  });

  revalidatePath(`/admin/companii/${orgId}`);
  revalidatePath("/admin/companii");
}

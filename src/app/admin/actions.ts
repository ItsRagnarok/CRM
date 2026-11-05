"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth";

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
  await requireAdminContext();
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return { error: "Numele firmei este obligatoriu." };
  const access = formData.get("access");
  if (access !== "active" && access !== "suspended") return { error: "Selectează starea accesului." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_admin_update_company", {
    org_id: orgId,
    company_name: companyName,
    company_cui: String(formData.get("cui") ?? "").trim(),
    company_email: String(formData.get("email") ?? "").trim(),
    company_phone: String(formData.get("phone") ?? "").trim(),
    company_address: String(formData.get("address") ?? "").trim(),
    new_plan: "pro",
    new_is_active: access === "active",
  });

  if (error) return { error: "Modificările nu au putut fi salvate. Încearcă din nou." };
  revalidatePath(`/admin/companii/${orgId}`);
  revalidatePath("/admin/companii");
  return { error: undefined };
}

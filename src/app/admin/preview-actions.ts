"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminContext, FIELD_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_COOKIE, UUID } from "@/lib/preview";

export async function startCompanyPreview(form: FormData) {
  await requireAdminContext();
  const organizationId = String(form.get("organizationId") ?? "");
  const profileId = String(form.get("profileId") ?? "");
  if (!UUID.test(organizationId) || !UUID.test(profileId)) throw new Error("Companie sau utilizator invalid.");
  const db = await createClient({ ignorePreview: true });
  const { data: users, error } = await db.rpc("platform_admin_list_company_users_v2", { org_id: organizationId });
  const selected = users?.find((u) => u.id === profileId);
  if (error || !selected) throw new Error("Utilizatorul nu aparține companiei selectate.");
  (await cookies()).set(PREVIEW_COOKIE, `${organizationId}:${profileId}`, {
    httpOnly: false, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600,
  });
  redirect(FIELD_ROLES.includes(selected.role) ? "/mobil" : "/dashboard");
}

export async function exitCompanyPreview() {
  await requireAdminContext();
  (await cookies()).delete(PREVIEW_COOKIE);
  redirect("/admin/companii");
}

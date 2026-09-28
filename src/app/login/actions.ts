"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completează email și parolă." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email sau parolă incorectă." };
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (platformAdmin) redirect("/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const fieldRoles = ["technician", "team_leader"];
  redirect(profile && fieldRoles.includes(profile.role) ? "/mobil" : "/dashboard");
}

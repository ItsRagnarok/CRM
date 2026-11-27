import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// După logare: Super Adminul merge în /admin, tehnicienii în aplicația de telefon, biroul în panou.
export default async function StartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: platformAdmin } = await supabase.from("platform_admins").select("id").eq("id", user.id).maybeSingle();
  if (platformAdmin) redirect("/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  // Field roles land on the mobile-optimized flow by default; office roles get the desktop dashboard.
  const fieldRoles = ["technician", "team_leader"];
  redirect(profile && fieldRoles.includes(profile.role) ? "/mobil" : "/dashboard");
}

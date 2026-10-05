import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingLanding } from "@/components/marketing/marketing-landing";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <MarketingLanding />;
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (platformAdmin) redirect("/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Field roles land on the mobile-optimized flow by default; office roles
  // (admin/manager) get the desktop dashboard. Either can still navigate to
  // the other manually — this only picks the default landing page.
  const fieldRoles = ["technician", "team_leader"];
  redirect(profile && fieldRoles.includes(profile.role) ? "/mobil" : "/dashboard");
}

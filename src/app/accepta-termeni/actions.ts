"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Deliberately NOT built on requireSessionContext — that function redirects
// here whenever terms aren't accepted yet, so calling it from this page's own
// actions would be a guaranteed loop. Session + role are re-checked directly.
async function requireAdminOfUnacceptedOrg(accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role, organization_id, organizations!profiles_organization_id_fkey(id, is_active, terms_accepted_at)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow?.organizations) {
    const { data: demo } = await supabase.rpc("company_demo_session").maybeSingle();
    if (!demo) redirect("/login");
    if (demo.state === "expired" || demo.state === "suspended") redirect("/cont-suspendat");
    if (demo.state === "active") redirect("/");
    if (!demo.is_admin) redirect("/accepta-termeni");
    const { error } = await supabase.rpc("company_demo_decide_terms", { accept_terms: accept });
    if (error) throw new Error("Decizia privind termenii nu a putut fi salvată.");
    redirect("/");
  }
  if (profileRow.role !== "admin") redirect("/accepta-termeni");

  return { supabase, organizationId: profileRow.organizations.id };
}

export async function acceptTerms() {
  const { supabase, organizationId } = await requireAdminOfUnacceptedOrg(true);

  await supabase
    .from("organizations")
    .update({ terms_accepted_at: new Date().toISOString(), terms_declined_at: null })
    .eq("id", organizationId);

  redirect("/");
}

export async function declineTerms() {
  const { supabase, organizationId } = await requireAdminOfUnacceptedOrg(false);

  await supabase
    .from("organizations")
    .update({ is_active: false, terms_declined_at: new Date().toISOString() })
    .eq("id", organizationId);

  redirect("/cont-suspendat");
}

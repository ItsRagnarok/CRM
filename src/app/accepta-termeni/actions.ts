"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Deliberately NOT built on requireSessionContext — that function redirects
// here whenever terms aren't accepted yet, so calling it from this page's own
// actions would be a guaranteed loop. Session + role are re-checked directly.
async function requireAdminOfUnacceptedOrg() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role, organization_id, organizations(id, is_active, terms_accepted_at)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow || !profileRow.organizations) redirect("/login");
  if (profileRow.role !== "admin") redirect("/accepta-termeni");

  return { supabase, organizationId: profileRow.organizations.id };
}

export async function acceptTerms() {
  const { supabase, organizationId } = await requireAdminOfUnacceptedOrg();

  await supabase
    .from("organizations")
    .update({ terms_accepted_at: new Date().toISOString(), terms_declined_at: null })
    .eq("id", organizationId);

  redirect("/");
}

export async function declineTerms() {
  const { supabase, organizationId } = await requireAdminOfUnacceptedOrg();

  await supabase
    .from("organizations")
    .update({ is_active: false, terms_declined_at: new Date().toISOString() })
    .eq("id", organizationId);

  redirect("/cont-suspendat");
}

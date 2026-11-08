"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseDomains } from "@/lib/domains";

export async function signup(_prevState: { error?: string } | undefined, formData: FormData) {
  // Company accounts are created by the platform admin, who sets up the domains
  // and plan for each firm. Self-service signup is closed.
  if (process.env.ALLOW_SELF_SIGNUP !== "1") {
    return { error: "Conturile de firmă se creează de echipa ElectroField. Programează o discuție pe electrofield.ro/programare." };
  }
  const orgName = String(formData.get("orgName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const termsAccepted = formData.get("termsAccepted") === "on";
  const domains = parseDomains(formData.getAll("domains"));

  if (!orgName || !fullName || !email || !password) {
    return { error: "Completează toate câmpurile." };
  }
  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }
  if (!termsAccepted) {
    return { error: "Trebuie să accepți Termenii și Politica de confidențialitate." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { org_name: orgName, full_name: fullName, domains } },
  });

  if (error) {
    return { error: error.message === "User already registered" ? "Există deja un cont cu acest email." : "Nu am putut crea contul. Încearcă din nou." };
  }

  // This checkbox is just a soft, generic "I agree" gate at signup time —
  // the actual, detailed Terms & Conditions (with the IP/anti-clone clause)
  // must be explicitly accepted by the org's admin on first login, via the
  // mandatory /accepta-termeni gate in requireSessionContext(). So this
  // always passes terms_accepted: false, regardless of this checkbox.
  if (data.session) {
    const { error: rpcError } = await supabase.rpc(
      "create_organization_and_owner",
      { org_name: orgName, owner_full_name: fullName, terms_accepted: false }
    );
    if (rpcError) {
      return { error: "Contul a fost creat, dar organizația nu a putut fi inițializată. Contactează suportul." };
    }
    const { data: created } = await supabase.from("profiles").select("organization_id").eq("id", data.user!.id).maybeSingle();
    if (created?.organization_id) {
      await supabase.from("organizations").update({ enabled_domains: domains }).eq("id", created.organization_id);
    }
    redirect("/dashboard");
  }

  redirect("/login?message=check-email");
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TermsContent } from "@/components/terms-content";
import { AcceptTermsForm } from "./accept-form";

export const dynamic = "force-dynamic";

// Deliberately does NOT call requireSessionContext() — that function
// redirects here whenever terms aren't accepted, so this page re-implements
// the lighter session fetch itself to avoid looping back to itself.
export default async function AcceptTermsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role, full_name, organizations(id, name, is_active, terms_accepted_at)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow || !profileRow.organizations) redirect("/login");
  const organization = profileRow.organizations;

  if (!organization.is_active) redirect("/cont-suspendat");
  if (organization.terms_accepted_at) redirect("/");

  const isAdmin = profileRow.role === "admin";

  return (
    <div className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12 text-[#1c1c22]">
      <h1 className="text-[22px] font-extrabold">Termeni și condiții — {organization.name}</h1>
      <p className="mt-1.5 text-[13.5px] text-muted-2">
        Înainte să continui, {organization.name} trebuie să accepte termenii și condițiile platformei.
      </p>

      <div className="mt-8 flex-1">
        <TermsContent />
      </div>

      {isAdmin ? (
        <AcceptTermsForm />
      ) : (
        <div className="sticky bottom-0 mt-6 rounded-[10px] border border-border bg-neutral-bg p-4 text-[13.5px] font-semibold text-[#475467]">
          Administratorul companiei trebuie să accepte acești termeni înainte ca tu să poți folosi platforma. Revino
          puțin mai târziu.
        </div>
      )}
    </div>
  );
}

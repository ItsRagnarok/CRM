import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

// Deliberately does NOT call requireSessionContext() — that function
// redirects here whenever the organization is inactive, so this page
// re-implements the lighter session fetch itself to avoid looping.
export default async function AccountSuspendedPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("organizations(name, is_active, terms_declined_at)")
    .eq("id", user.id)
    .maybeSingle();

  const organization = profileRow?.organizations;
  if (organization?.is_active) redirect("/");

  const declinedTerms = Boolean(organization?.terms_declined_at);

  return (
    <div className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-[14px] border border-danger-bg bg-danger-bg/40 p-7">
        <h1 className="text-[19px] font-extrabold text-danger">Cont suspendat</h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#475467]">
          {declinedTerms ? (
            <>
              Contul companiei {organization?.name} a fost suspendat deoarece a refuzat Termenii și condițiile
              platformei. Pentru a relua accesul, contactează-ne la{" "}
              <a href="mailto:contact@alpora.ro" className="font-semibold text-electric">
                contact@alpora.ro
              </a>
              .
            </>
          ) : (
            <>
              Contul companiei {organization?.name} a fost suspendat de administratorul platformei. Pentru detalii,
              contactează-ne la{" "}
              <a href="mailto:contact@alpora.ro" className="font-semibold text-electric">
                contact@alpora.ro
              </a>
              .
            </>
          )}
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}

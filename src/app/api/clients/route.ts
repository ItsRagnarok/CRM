import { NextResponse, type NextRequest } from "next/server";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const clientType = String(formData.get("clientType") ?? "company") as
    | "company"
    | "individual";
  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const cui = String(formData.get("cui") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!name) {
    return NextResponse.redirect(
      new URL(`/clienti/nou?error=${encodeURIComponent("Numele clientului este obligatoriu.")}`, request.url),
      303
    );
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organization.id,
      name,
      client_type: clientType,
      company_name: companyName,
      cui,
      phone,
      email,
      address,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.redirect(
      new URL(`/clienti/nou?error=${encodeURIComponent("Nu am putut salva clientul. Încearcă din nou.")}`, request.url),
      303
    );
  }

  return NextResponse.redirect(new URL(`/clienti/${data.id}`, request.url), 303);
}

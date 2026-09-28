"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

type ClientType = Database["public"]["Tables"]["clients"]["Row"]["client_type"];

export async function updateClient(
  clientId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Numele clientului este obligatoriu." };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      client_type: String(formData.get("clientType") ?? "company") as ClientType,
      company_name: String(formData.get("companyName") ?? "").trim() || null,
      cui: String(formData.get("cui") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
    })
    .eq("id", clientId)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: "Nu am putut salva modificările. Încearcă din nou." };
  }

  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
  redirect(`/clienti/${clientId}`);
}

export async function toggleClientStatus(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const currentStatus = String(formData.get("currentStatus") ?? "active");
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("clients")
    .update({ status: currentStatus === "active" ? "inactive" : "active" })
    .eq("id", clientId)
    .eq("organization_id", organization.id);

  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
}

export async function addLocation(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!clientId || !address) return;

  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  await supabase.from("locations").insert({
    organization_id: organization.id,
    client_id: clientId,
    address,
    label,
  });

  revalidatePath(`/clienti/${clientId}`);
}

export async function deleteLocation(formData: FormData) {
  const locationId = String(formData.get("locationId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!locationId) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId);

  if (count && count > 0) {
    redirect(
      `/clienti/${clientId}?locationError=${encodeURIComponent(
        "Acest punct de lucru este folosit de cel puțin o lucrare și nu poate fi șters."
      )}`
    );
  }

  await supabase.from("locations").delete().eq("id", locationId);
  revalidatePath(`/clienti/${clientId}`);
}

export async function addContact(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!clientId || !name) return;

  const supabase = await createClient();

  await supabase.from("client_contacts").insert({
    client_id: clientId,
    name,
    role: String(formData.get("role") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
  });

  revalidatePath(`/clienti/${clientId}`);
}

export async function deleteContact(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!contactId) return;

  const supabase = await createClient();
  await supabase.from("client_contacts").delete().eq("id", contactId);
  revalidatePath(`/clienti/${clientId}`);
}

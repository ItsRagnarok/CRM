"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";
import { geocodeAddress } from "@/lib/geocode";

type ClientType = Database["public"]["Tables"]["clients"]["Row"]["client_type"];

export async function createNewClient(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Numele clientului este obligatoriu." };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organization.id,
      name,
      client_type: String(formData.get("clientType") ?? "company") as ClientType,
      company_name: String(formData.get("companyName") ?? "").trim() || null,
      cui: String(formData.get("cui") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Nu am putut salva clientul. Încearcă din nou." };
  }

  revalidatePath("/clienti");
  redirect(`/clienti/${data.id}`);
}

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

  const coords = await geocodeAddress(address);

  await supabase.from("locations").insert({
    organization_id: organization.id,
    client_id: clientId,
    address,
    label,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
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

export async function createInvoice(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const jobId = String(formData.get("jobId") ?? "") || null;
  const laborAmount = Number(formData.get("laborAmount") ?? 0) || 0;
  const materialsAmount = Number(formData.get("materialsAmount") ?? 0) || 0;
  const travelAmount = Number(formData.get("travelAmount") ?? 0) || 0;
  const otherAmount = Number(formData.get("otherAmount") ?? 0) || 0;
  const total = laborAmount + materialsAmount + travelAmount + otherAmount;
  if (!clientId || total <= 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  const invoiceNumber = `FACT-${String((count ?? 0) + 1).padStart(4, "0")}`;

  // total_amount is a DB-generated column (sum of the four below) — sending
  // it explicitly is rejected outright, not just ignored.
  await supabase.from("invoices").insert({
    organization_id: organization.id,
    client_id: clientId,
    job_id: jobId,
    invoice_number: invoiceNumber,
    labor_amount: laborAmount,
    materials_amount: materialsAmount,
    travel_amount: travelAmount,
    other_amount: otherAmount,
    created_by: userId,
  });

  revalidatePath(`/clienti/${clientId}`);
}

export async function addClientDocument(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const file = formData.get("file") as File | null;
  if (!clientId || !file || file.size === 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${organization.id}/clients/${clientId}/documents/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return;

  await supabase.from("documents").insert({
    organization_id: organization.id,
    client_id: clientId,
    name: file.name,
    doc_type: String(formData.get("docType") ?? "").trim() || null,
    storage_path: path,
    uploaded_by: userId,
  });

  revalidatePath(`/clienti/${clientId}`);
}

export async function deleteClientDocument(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!documentId) return;

  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("attachments").remove([storagePath]);
  }
  await supabase.from("documents").delete().eq("id", documentId);
  revalidatePath(`/clienti/${clientId}`);
}

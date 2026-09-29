"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function updateEmployeeEmail(
  profileId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await requireSessionContext();
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Emailul este obligatoriu." };
  }

  const { error } = await supabase.rpc("company_admin_update_employee_email", {
    target_profile_id: profileId,
    new_email: email,
  });

  if (error) {
    return { error: error.message.includes("Există deja") ? error.message : "Nu am putut salva emailul." };
  }

  revalidatePath(`/setari/utilizatori/${profileId}`);
  return { success: true };
}

export async function resetEmployeePassword(
  profileId: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await requireSessionContext();
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  const { error } = await supabase.rpc("company_admin_reset_employee_password", {
    target_profile_id: profileId,
    new_password: password,
  });

  if (error) {
    return { error: "Nu am putut reseta parola." };
  }

  return { success: true };
}

export async function addUserDocument(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const file = formData.get("file") as File | null;
  if (!profileId || !file || file.size === 0) return;

  const { organization, userId } = await requireSessionContext();
  const supabase = await createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${organization.id}/employees/${profileId}/documents/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return;

  await supabase.from("documents").insert({
    organization_id: organization.id,
    profile_id: profileId,
    name: file.name,
    doc_type: String(formData.get("docType") ?? "").trim() || null,
    storage_path: path,
    uploaded_by: userId,
  });

  revalidatePath(`/setari/utilizatori/${profileId}`);
  revalidatePath("/mobil/documente");
}

export async function deleteUserDocument(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!documentId) return;

  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("attachments").remove([storagePath]);
  }
  await supabase.from("documents").delete().eq("id", documentId);
  revalidatePath(`/setari/utilizatori/${profileId}`);
  revalidatePath("/mobil/documente");
}

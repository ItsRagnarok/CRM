"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBackOfficeContext } from "@/lib/auth";

export async function approveExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) return;
  const ctx = await requireBackOfficeContext();
  if (!ctx) return;
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({
      status: "approved",
      approved_by: ctx.userId,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", expenseId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath("/cheltuieli");
}

export async function rejectExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!expenseId) return;
  const ctx = await requireBackOfficeContext();
  if (!ctx) return;
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({ status: "rejected", rejection_reason: reason, approved_by: null, approved_at: null })
    .eq("id", expenseId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath("/cheltuieli");
}

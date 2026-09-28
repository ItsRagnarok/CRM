"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

export async function approveExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  if (!expenseId) return;
  const { userId } = await requireSessionContext();
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", expenseId);

  revalidatePath("/cheltuieli");
}

export async function rejectExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!expenseId) return;
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({ status: "rejected", rejection_reason: reason, approved_by: null, approved_at: null })
    .eq("id", expenseId);

  revalidatePath("/cheltuieli");
}

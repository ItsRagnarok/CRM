"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addExpense } from "@/app/(app)/lucrari/[id]/actions";
import { confirmAi } from "@/app/mobil/ai/actions";

// Thin wrapper so the technician lands back on his own expense list.
export async function submitMobileExpense(formData: FormData) {
  await addExpense(formData);
  // Bon citit cu AI: notăm în jurnal ce a rămas după verificarea omului.
  const logId = String(formData.get("aiLogId") ?? "");
  if (logId) {
    let suggested: Record<string, unknown> = {};
    try { suggested = JSON.parse(String(formData.get("aiSuggested") ?? "{}")); } catch { /* fără propuneri */ }
    await confirmAi(logId, suggested, {
      amount: String(formData.get("amount") ?? ""),
      date: String(formData.get("expenseDate") ?? ""),
      vendor: String(formData.get("vendor") ?? ""),
      category: String(formData.get("category") ?? ""),
    });
  }
  revalidatePath("/mobil/cheltuieli");
  redirect("/mobil/cheltuieli?trimis=1");
}

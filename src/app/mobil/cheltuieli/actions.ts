"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addExpense } from "@/app/(app)/lucrari/[id]/actions";

// Thin wrapper so the technician lands back on his own expense list.
export async function submitMobileExpense(formData: FormData) {
  await addExpense(formData);
  revalidatePath("/mobil/cheltuieli");
  redirect("/mobil/cheltuieli?trimis=1");
}

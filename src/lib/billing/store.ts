import "server-only";
import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_COOKIE, parsePreview } from "@/lib/preview";

export async function billingDb() {
  await requireAdminContext();
  if (parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value)) {
    throw new Error(
      "Închide vizualizarea companiei înainte de a folosi facturarea.",
    );
  }
  return createClient({ ignorePreview: true });
}

export class BillingError extends Error {}
export async function workflow<T>(
  operation: string,
  input: Record<string, unknown> = {},
) {
  const db = await billingDb();
  const { data, error } = await db.rpc("billing_workflow", {
    operation,
    input: input as import("@/lib/supabase/database.types").Json,
  });
  if (error) {
    if (error.code === "P0001") throw new BillingError(error.message);
    if (error.code === "23505")
      throw new BillingError(
        "Această înregistrare există deja. Reîncarcă pagina.",
      );
    if (
      ["23514", "22P02", "22007", "22003", "23502", "23503"].includes(
        error.code,
      )
    )
      throw new BillingError(
        "Verifică datele, clientul, seria și valorile liniilor.",
      );
    throw new BillingError("Operația nu a putut fi salvată. Reîncearcă.");
  }
  return data as T;
}
